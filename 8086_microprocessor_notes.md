# 8086 Microprocessor Architecture Notes

This document is a consolidated transcription of handwritten notes on the 8086 microprocessor, formatted for study and ingestion into NotebookLM.

## 1. Introduction to Microprocessors

*   **Microprocessor (µP):** An integrated circuit that contains all the functions of a central processing unit of a computer.
*   **Memory:** Storage space where the microprocessor stores data.
    *   **RAM (Random Access Memory):** Read and Write memory. It is volatile, meaning data is lost when power is turned off.
    *   **ROM (Read Only Memory):** Used primarily to boot the computer. It is non-volatile, meaning data is retained even when power is turned off.

*   **System Bus:** A combination of buses used to connect the microprocessor to memory and other components.
    *   **Address Bus:** Used by the microprocessor to specify the memory location it wants to access. This bus is **unidirectional** (Microprocessor $\rightarrow$ Memory).
    *   **Data Bus:** Used to transfer data between the microprocessor and memory. This bus is **bidirectional** (Microprocessor $\leftrightarrow$ Memory).
    *   **Control Bus:** Used to send control signals (e.g., Read or Write commands) from the microprocessor to memory.

## 2. System Buses and Control Signals

### Address and Data Buses
*   **8085 Microprocessor:** Has a 16-bit address bus and an 8-bit data bus.
*   **8086 Microprocessor:** Has a 20-bit address bus and a 16-bit data bus.
*   **Address Space:** A 20-bit address bus means the 8086 can access $2^{20}$ memory locations, which equals 1 Megabyte (1 MB) of memory.

### Multiplexed Pins
To reduce the number of pins on the IC, some pins serve dual purposes (multiplexing).
*   **AD0 to AD15:** Multiplexed Address and Data pins.
*   **A16 to A19:** Pure Address pins (or multiplexed with status signals).

### Control Signals
*   **M/IO' (Memory / Input-Output):** Since the address bus is shared for both memory and I/O devices, this pin indicates which one the microprocessor intends to communicate with.
    *   If `M/IO' = 1`: The microprocessor communicates with Memory.
    *   If `M/IO' = 0`: The microprocessor communicates with I/O devices.
*   **RD' (Read) and WR' (Write):** Active-low signals that indicate the operation to perform.

| M/IO' | RD' | WR' | Operation |
| :--- | :--- | :--- | :--- |
| 1 | 0 | 1 | Memory Read |
| 1 | 1 | 0 | Memory Write |
| 0 | 0 | 1 | I/O Read |
| 0 | 1 | 0 | I/O Write |

## 3. 8086 Internal Architecture Overview

The 8086 architecture is divided into two main logical units: the **Bus Interface Unit (BIU)** and the **Execution Unit (EU)**.

### Bus Interface Unit (BIU)
*   Responsible for fetching instructions and data from memory.
*   Contains the **Segment Registers**, **Instruction Pointer (IP)**, and a **6-Byte Pre-fetch Queue**.
*   **Pre-fetch Queue:** Stores up to 6 bytes of instructions fetched in advance from memory. It acts as a buffer and sends instructions to the EU. An instruction cannot exceed 6 bytes in length.
*   Contains a summer (adder) circuit which calculates the 20-bit physical address for fetching data/instructions.

### Execution Unit (EU)
*   Responsible for executing the instructions received from the BIU.
*   Contains the **Arithmetic Logic Unit (ALU)**, **General Purpose Registers**, and the **Control Unit**.
*   **Instruction Decoding:** The opcode from the pre-fetch queue is sent to the control section, where decoding happens, and appropriate control signals are pulled.

### General Purpose Registers
The 8086 has general-purpose registers that can be used either as 8-bit registers or combined into 16-bit registers:
*   **AX:** Accumulator (16-bit) $\rightarrow$ AH (8-bit High) + AL (8-bit Low)
*   **BX:** Base (16-bit) $\rightarrow$ BH + BL
*   **CX:** Count (16-bit) $\rightarrow$ CH + CL
*   **DX:** Data (16-bit) $\rightarrow$ DH + DL

## 4. Pipelining

*   **Pipelining** is the process where the BIU fetches the next instruction while the EU is executing the current instruction. This overlaps fetch and execute cycles, speeding up processing.
*   **Disadvantages of Pipelining:** Pipelining is data-dependent and fails when there is a branch (jump) in the program.
    *   If Instruction 1 is executing and suddenly a loop or jump hits, directing the microprocessor to Instruction 8, the intermediate instructions (which were already fetched into the 6-byte queue) must be discarded.
    *   *(Note: Modern processors like Pentium use branch prediction algorithms to resolve this issue).*

## 5. Memory Banking

### Need for Memory Banking
*   The 8086 is a 16-bit microprocessor (it processes 16 bits at a time).
*   However, a single memory location only stores 8 bits (1 byte) of data. Therefore, the microprocessor cannot transfer 16-bit data in a single clock cycle using standard linear memory.
*   **Solution:** Memory Banking splits the 1 MB memory into two 512 KB banks so that two consecutive memory locations reside in different memory chips and can be accessed simultaneously.

### Odd and Even Banks
*   **Odd Bank (Higher Bank - HB):** 512 KB, connected to the upper 8 bits of the data bus (D8-D15). Selected by the **BHE' (Bus High Enable)** signal.
*   **Even Bank (Lower Bank - LB):** 512 KB, connected to the lower 8 bits of the data bus (D0-D7). Selected by the **A0** address line.
*   By using Memory Banking, the microprocessor can access both chips at the same time (for a 16-bit transfer) or a single chip at a time (for an 8-bit transfer).

### Bank Selection Truth Table
| BHE' | A0 | Operation |
| :--- | :--- | :--- |
| 0 | 0 | Read/Write 16-bit word from Both Banks |
| 0 | 1 | Read/Write 8-bit byte from Higher Bank (Odd) |
| 1 | 0 | Read/Write 8-bit byte from Lower Bank (Even) |
| 1 | 1 | None (Idle state) |

## 6. Memory Segmentation

*   **Purpose:** Segmentation is used to organize memory efficiently and prevent data from being overwritten. The 1 MB memory is divided into logical segments.
    *   **Code Segment:** Grows top to bottom.
    *   **Stack Segment:** Grows bottom to top.
    *   **Data / Extra Segment:** Can grow on both sides.
*   **Virtual vs. Physical Address:** The 8086 address space is 20 bits ($2^{20} = 1$ MB). Using 20-bit addresses directly in 16-bit registers would waste memory space and require two fetch cycles for addresses. Instead of directly using a 20-bit physical address, the 8086 uses two 16-bit virtual addresses (Segment and Offset).

### Segment and Offset Registers
*   **Segment Address:** Provides the starting number of the segment. Stored in Segment Registers (inside the microprocessor).
    *   `CS` - Code Segment
    *   `SS` - Stack Segment
    *   `DS` - Data Segment
    *   `ES` - Extra Segment
*   **Offset Address:** Provides the specific location number from the start of the segment. Stored in Offset/Index Registers.
    *   For `CS` $\rightarrow$ `IP` (Instruction Pointer)
    *   For `SS` $\rightarrow$ `SP` (Stack Pointer - for push/pop) and `BP` (Base Pointer - for random access of the stack)
    *   For `DS` $\rightarrow$ `SI` (Source Index)
    *   For `ES` $\rightarrow$ `DI` (Destination Index)

### Physical Address Calculation
*   **Formula:** `Physical Address (PA) = (Segment Address * 10H) + Offset Address`
*   **Properties:**
    *   Since the offset address is only 16-bit (0000H to FFFFH), a segment size is strictly 64 KB.
    *   It cannot overflow the 1 MB memory size because $64$ KB $< 1$ MB.
    *   A segment address can only be a multiple of 10H. The minimum size of a segment shift is 10H (16 bytes, also known as a paragraph).

## 7. Flag Register

The Flag Register provides status about the current result of the ALU and controls certain processor behaviors.
*(Note: A temporary storage register called `Operands` is used internally by the microprocessor, but it is not accessible by the programmer).*

### Status Flags (Changed by the Microprocessor)
*   **CF (Carry Flag):** Set to 1 when two numbers are added and a carry is generated out of the most significant bit.
*   **PF (Parity Flag):** Set to 1 if the current result has an even number of ones. Set to 0 if the number of ones is odd. (e.g., `1011` has three 1s, so PF=0).
*   **AC (Auxiliary Carry Flag):** Set to 1 when a carry is generated from the lower nibble to the higher nibble (from bit 3 to bit 4).
*   **ZF (Zero Flag):** Set to 1 if the result of an operation is 0, and vice versa.
*   **SF (Sign Flag):** Simply copies the most significant digit (MSB) of the result. If SF=0, the result is positive. If SF=1, the result is negative.
    *   *Unsigned numbers:* 0 to 255 (00H to FFH)
    *   *Signed numbers:* -128 to +127 (-80H to 7FH)
*   **OF (Overflow Flag):** Set to 1 when an overflow occurs in signed arithmetic. In case of an overflow, the SF will give the wrong result, so OF helps identify this error.

**Example of Flags Output:**
*   `42H + 23H = 65H` $\rightarrow$ `0100 0010 + 0010 0011 = 0110 0101` (Flags: OF=0, SF=0, ZF=0, AC=0, PF=0, CF=0)
*   `42H + 43H = 85H` $\rightarrow$ `0100 0010 + 0100 0011 = 1000 0101` (Flags: OF=1, SF=1, ZF=0, AC=0, PF=0, CF=0)

### Control Flags (Changed by the Programmer)
*   **TF (Trap Flag):** Used for single-stepping through code (reviewing code line-by-line for debugging). When TF=1, the microprocessor executes one instruction and stops (traps). When TF=0, it runs normally.
*   **IF (Interrupt Flag):** Turn ON (IF=1) when interrupts are needed, and turn OFF (IF=0) to ignore external interrupts.
*   **DF (Direction Flag):** Tells the microprocessor whether to process strings by decrementing (DF=1) or incrementing (DF=0). By default, all flags are 0.

## 8. Addressing Modes

Addressing modes define the manner in which operands (data) are specified in an instruction.

### 1. Immediate Addressing Mode
Data is provided directly in the instruction itself.
*   Example: `MOV CL, 34H` (Moves the hex value 34 into the CL register).

### 2. Register Addressing Mode
Data is transferred between registers.
*   Example: `MOV CL, BL` (Copies data from BL to CL). `INC BL` (Increments BL).

### 3. Direct Addressing Mode
The memory address is directly specified in the instruction inside square brackets `[ ]`.
*   Example: `MOV CL, [2000H]` (Moves the 8-bit contents of memory location 2000H into CL).
*   Example: `MOV [2001H], CL`
*   Example: `MOV CX, [2000H]` (Moves 16 bits of data: the contents of 2000H and 2001H into the 16-bit CX register).

### 4. Indirect Addressing Mode
The address is held in a register. This is the most common mode (used in ~90% of operations).
#### 4.1 Register Indirect
The address is simply given by a base or index register. Only 4 registers can be used to hold memory addresses: `BX`, `BP`, `SI`, and `DI`.
*   Example: `MOV CL, [BX]` (CL gets the data from the memory location whose address is stored in BX).
*   *Default Segments:* `BX`, `SI`, and `DI` work on the Data Segment by default. `BP` works on the Stack Segment by default (though it can be overridden).

#### 4.2 Register Relative
`Address = Register + Displacement`
*   Example: `MOV CL, [BX + 03H]`

#### 4.3 Base Indexed
`Address = Base Register + Index Register`
*   *Base Registers:* `BX`, `BP`
*   *Index Registers:* `SI`, `DI`
*   Example: `MOV CL, [BX + SI]` or `MOV CL, [BP + SI]`
*   *Valid Combinations:*
    *   `BX + SI` $\rightarrow$ Data Segment
    *   `BX + DI` $\rightarrow$ Data Segment
    *   `BP + SI` $\rightarrow$ Stack Segment
    *   `BP + DI` $\rightarrow$ Stack Segment
    *   *Note: `BX + BP` or `SI + DI` combinations are not possible.*

#### 4.4 Base Relative Plus Indexed
`Address = Base Register + Index Register + Displacement`
*   Example: `MOV CL, [BX + SI + 03H]`

### 5. Implied Addressing Mode
Neither data nor memory addresses are given. The operand is implied by the instruction itself.
*   Example: `STC` (Set Carry Flag, CF=1)
*   Example: `CLC` (Clear Carry Flag, CF=0)
*   Example: `DAA` (Decimal Adjust AL after Addition)
