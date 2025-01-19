---
layout: "../../layouts/Markdown.astro"
title: Notes from Casey Muratori's course
---

How to increase performance:
	A:  Reduce the number of the CPU instructions
	B:  Increase the speed those instructions are processed

5 main options we have:
- remove the waste (A) – Python has significantly more instructions for a loop than C
- IPC (instructions per clock) / ILP (instruction-level parallelism) (B) – how to properly structure the instructions so that CPU can execute them independently/in parallel.
- SIMD (single instruction, multiple data) (A) – instead of sending four ADD instructions, we can add 4 pairs of numbers in one instruction
-  Caching (B) – l1, l2, l3, ram
- Multi-threading (B) – efficiently use CPU cores

**unrolling** the loop

```c
int sum(u32 count, u32 *arr) {
	u32 s = 0;
	for (u32 idx = 0; idx < count; idx += 1) {
		s += arr[idx];
	}

	return s;
}
```

can become

```c
// note: I think there is an issue with the condition idx < count, but the example should be clear
int sum_unroll(u32 count, u32 *arr) {
	u32 s = 0;
	for (u32 idx = 0; idx < count; idx += 2) {
		s += arr[idx];
		s += arr[idx + 1];
	}

	return s;
}
```

So, we are doing more "useful" operations by doing 2 additions and then the loop checks, instead of the loop check for every addition. So, we can put more "meaningful" work in the "instruction per clock"

 so, the CPU instructions would look like
```
ADD A, input[i]
ADD A, input[i + 1]
...
cmp (the loop stuff)
ADD A, input[i]
ADD A, input[i + 1]
```


But the problem is, we have a constant dependency on A, so in order to execute the next instruction CPU has to execute the current one.

The nice thing about addition, is that it's associative. In order to add a list of
1 + 2 + 3 + 4 + 5 + 6

we can do (1 + 2) + (3 + 4) + (5 + 6) in parallel and add the sums in the end

so, the faster approach would be to
```
ADD A, input[i]
ADD B, input[i + 1]
ADD A, B
```

```
ADD A, input[i]
ADD B, input[i + 1]
```
will be executed in parallel as they do not have any dependency on each other

SIMD - single instruction, multiple data

Why instead of adding 2 numbers per instruction and doing it hundreds/thousands of times, we just squash/pack them in 1 instruction

```
SSE
PADDD
```

The CPU has cache layers
l1, l2, l3 (maybe) and then RAM
When the CPU is loading data it goes by hierarchy from L1 to RAM, where L1 is the fastest and smallest and RAM is the biggest and slowest (not talking about the virtual memory yet).

**Multi-threading  and CPU cores**

Core - a physical term regarding the actual CPU
Thread - an OS term

In order to do the multi-core programming, we have to use the multiple threads, as threads are a way for a developer to communicate to the system that we need to execute something in parallel on multiple cores.

### 8086 CPU

"mov" - a "mnemonic" made by Intel to represent the copying from one register to another. It's not really moving, but rather copying data from the memory to the registers.

So, instead of writing instructions in binary, due to humans being bad at reading and writing it, we write the instructions in a more human-friendly way.

```
mov ax, bx
```

The CPU doesn't understand these instructions, but humans do. So, for CPU to understand it, we need to translate the assembly language notation to CPU-friendly format (binary).

"mov" - mnemonic
"ax, bx" - operands "destination, source"

to simplify reasoning of operads order
mov ax = bx
mov dest = src

These instructions are encoded into a binary representation that a CPU can decode and execute

So, the `mov ax, bx` will be encoded to something like (just an example, may not be accurate)
```
8 bits      8 bits
[100010dw] [mod, reg, r/m]
```

the `100010` means the `mov` operation, the d,w are 1-bit flags
mod - 2 bits - is it a "memory" or "register" operation
reg - 3 bits - encodes a register
r/m - 3 bits - encodes a register/memory
d - which bit is a destination register; 0 means the "reg" bit is not a destination, 1 means that the "reg" bit is a destination
w - wide (is 16 bit or not)

Why would you need the `D` bit?
If I wanted to do the load (from mem), then the register is the destination (`d` = 1) `mov bx, [bp + 75]`
If I wanted to do a store `mov [<mem>], bx`, then `d` has to be set to 0, because the memory encoding (`<mem>`) is bulky, it won't fit into 3 bits

__immediate__ `mov`means that the value is directly encoded and there is no need to fetch it from memory
`mov ax, 12`, 12 - immediate

#### Registers
AX, BX - 16 bit
AL, BL - 8 bit (low of AX, BX)
AH, BH - 8 bit (high of AX, BX)

|    16   |
|  8 |  8 |
 -   -   -
| ah | al | -> ax
| bh | bl | -> bx
| ch | cl | -> cx
| dh | dl | -> dx
|    sp   | -> stack pointer
|    bp   | -> base pointer
|    si   | -> source index
|    di   | -> destination index


Register AX
[ah al] - [00000000 00000000] (16 bits)

#### Signed & Unsigned numbers

XOR - exclusive or

| A | B | A XOR B |
-------------------
| 0 | 0 |    0    |
| 0 | 1 |    1    |
| 1 | 0 |    1    |
| 1 | 1 |    0    |

to find the value of the signed byte:
- flip all bits (XOR with 0b11111111 or using the NOT operator)
- add one

5 -> 0000 0101
-5 -> 1111 1011

-5 -> 1111 1011 -> not (1111 1011) -> 0000 0100 + 1 -> 0000 0101


#### Effective address

EU - execution unit
BIU - bus interface unit
EA - effective address; It is an unsigned 16-bit number that
expresses the operand's distance in bytes from the
beginning of the segment in which it resides.

Information encoded in the
second byte of the instruction tells the EU how to
calculate the effective address of each memory
operand.

```go
// [opcode|d|m] [mod|reg|r/m] [displacement-low] [displacement-high] [data-low] [data-high]
//    6    1 1    2   3   3
// The intel x86 processors use Little Endian, so the low byte comes first
// Disp-lo (Displacement low) - Low-order byte of optional 8- or 16-bit __unsigned__ displacement; MOD indicates if present.
// Disp-hi (Displacement High) - High-order byte of optional 16-bit __unsigned__ displacement; MOD indicates if present.
// Data-lo (Data low) - Low-order byte of 16-bit immediate constant.
// Data-hi (Data high) - High-order byte of 16-bit immediate constant.
```

The `[<equation> + displacement]` is called an `effective address`.
The equations can only be:
- bx + si
- bx + di
- bp + si
- bp + di
- si
- di
- bp or direct address (mod = 00)
- bx
The `[<equation>]` is encoded with `r/m`

The displacement is optional and determined by the `mod` bits (register mode)
the `mod` is `11` when the operation is between the registers
the `mod` is `00` when the operation is using memory, __without__ displacement
the `mod` is `01` when the operation is using memory with 8-bit displacement
the `mod` is `10` when the opertation is using memory with 16-bit displacement

Exception: `mod` 00 can still have a displacement if `r/m` is `110`
