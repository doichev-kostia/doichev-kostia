---
layout: "../../layouts/Markdown.astro"
title: CS
---

## Terminology
Mathmatical terms in English

Addition:
Addend + Addend = Sum (Доданок + Доданок = Сума)
Subtraction:
Minuend - Subtrahend = Difference (Зменшуване - Від'ємник = Різниця)
Multiplication:
Multiplicand * Multiplier = Product (Множене * Множник = Добуток)
Division:
Dividend / Divisor = Quotient (+Remainder) (Ділене / Дільник = Частка (+Остача))

Fractions
```
3    <-- Numerator (EN) / Чисельник (UA)
-	 <-- Fraction bar (vinculum)
4    <-- Denominator (EN) / Знаменник (UA)
```

Power/Exponent
```
2^3 (2 is the base, 3 is the exponent)
```

Root/Radical
```
√4 (square root = квадратний корінь)
∛8 (cube root = кубічний корінь)
```

There is also a difference between US and European system of long division
255 / 2 = 127 remainder 1

European
```
 255  | 2
-2    ----
 ---  | 127
  5
 -4
 ---
  15
 -14
  ---
   1
```

US
```
  127 r 1
  -----
2 ) 255
   -2
   -----
   	 5
    -4
    ------
     15
    -14
    ----
      1
```

Complement is not "praise someone".
Complement (noun): In general terms, a complement is something that __completes__ or makes something whole.
In mathematics, it often refers to the "opposite" or "inverted" part of something.

One's complement:
0 needs 1 to get to 1
1 needs 0 to get to 1
flip all the bits (0->1 and 1->0) (Logical NOT)

For an n-bit number, the one's complement of a number N can be thought of as:
One’s complement of N=(2^n−1)−N
N = 4
we need 3-bit system to represent 4
one's complement of 4 = (2^3 - 1) - 4 => 3
So, in a 3-bit system:
- The binary representation of 4 is 100.
- Its one's complement (flipping every bit) is 011, which represents 3 in binary.

In a 8-bit system:
 - (2^8 - 1) - 4 = 255 - 4 = 251 (0b11111011)

Two's complement:
flip all the bits AND add 1
2^n = (2^n - 1) + 1
Two’s complement of N=2^n−N

N = 4
in a 8-bit system
The two's complement of N = 2^8 - 4 = 252 (0b11111100)


## Binary

8 bit unsigned number
`[0 - 255]`

8 bit signed numbers
`[-128 - 127]`

The high-order (leftmost) bit is interpreted as the number's sign:
0 - positive
1 - negative

Negative numbers are represented in standard two's complement notation.
Basically, we flip the bits and add 1. If you flip the bits, the high-order bit will naturally determine the sign
The "flip the bits" can be done either by using _unary NOT_ or _XOR 0xFF_.

for a positive integer, each position that there is 1 in, you put as a exponent to 2
7|6|5|4|3|2|1|0

```
00000001 -> 2^0 -> 1
00001000 -> 2^3 -> 8
00001010 -> 2^3 + 2^1 -> 10
```

for a negative integer
there is a "correct" way:
You still do all the same, except, in the end you subtract it from -128
```
11111011 -> -128 + 2^6 + 2^5 + 2^4 + 2^3 + 2^1 + 2^0 -> -128 + 64 + 32 + 16 + 8 + 2 + 1 -> -5
```
or there is my way:
each position there is a zero in, do -1*(2^pos) and subtract 1
```
11111011 -> -1 * (2 ^ 2) - 1 -> -5
11111110 -> -1 * (2 ^ 0) - 1 -> -2
11111100 -> -(2^0 + 2^1) - 1 -> -4
10000000 -> -(2^6 + 2^5 + 2^4 + 2^3 + 2^2 + 2^1 + 2^0) - 1 -> -128
```

Basically, we use a mirroring, if we flip the bits, we flip the way we calculate the numbers

Now, when we expand the integer to 16 bit, we need to "pad left"
for positive numbers, we pad with 0
```
8-bit:  00000101 (5)
16-bit: 0000000000000101 (still 5)
```

for negatives, same "flip" principle applies
```
8-bit:  11111011 (-5)
16-bit: 1111111111111011 (still -5)
```

The thing to keep in mind is to not screw up with signed or unsigned,
because while `11111011` is -5 in a signed interpretation,
for unsigned it's 251

## How the CPU actully executes things

The programs are compiled to the "machine code" - a sequence of bytes which represent instructions. Usually, each instruction has an "opcode",
which is an ID of "what needs to be done" and some operands that have additional metadata.

For instance, in 8086 CPU, one of the opcodes for addition is `0000010`, but to add something, you need, well..., something. Those are the operands.
So, the add instuction can be `00000100 00001001` which in assemly means `add al, 9`. The first byte stands for "add to register al",
the second byte stands for "9".

See https://defuse.ca/online-x86-assembler.htm#disassembly
