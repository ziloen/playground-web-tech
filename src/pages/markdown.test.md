# Markdown Stress Test Sample

**Bold text** and _italic text_ and ~~strikethrough~~ and `inline code`.

> A blockquote with **bold**, _italic_, and `code`.
>
> > Nested blockquote level 2.
> >
> > - nested list item
> > - another item

---

## Lists

1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

- Unordered item
  - Nested bullet
    - Deeper nested bullet
- Another bullet

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

---

## Table

| Left            |    Center     |       Right |
| :-------------- | :-----------: | ----------: |
| a               |       b       |           c |
| long text       | **bold cell** | `code cell` |
| escaped \| pipe |    aligned    |         123 |

---

## Links and references

[Inline link](https://example.com)

Reference link [OpenAI][openai-link]

[openai-link]: https://openai.com

Autolink: <https://example.com>

---

## Footnotes

Here is a sentence with a footnote.[^1]  
Another footnote here.[^note]

[^1]: This is the first footnote.
[^note]: This is a longer footnote with **bold**, `code`, and a list:
    - item one
    - item two

---

## Definition list

Term 1
: Definition for term 1

Term 2
: Definition for term 2 with **bold text**

---

## Abbreviation

HTML: <abbr title="HyperText Markup Language">HTML</abbr>  
CPU: <abbr title="Central Processing Unit">CPU</abbr>

---

## Details

<details>
<summary>Click to expand</summary>

Inside details:
- item A
- item B

> A quote inside details.

</details>

---

## Raw HTML

<div style="padding:8px;border:1px solid #999;">
  <strong>HTML block</strong> with <em>inline tags</em>.
</div>

<!-- This is an HTML comment -->

---

## Escaped characters

\* not italic \*  
\_ not italic \_  
\# not heading  
\> not quote  
\` not code  
\\ backslash  
\[\] brackets  
\(\) parentheses  
\| pipe

---

## Long code block

```python
def factorial(n):
    if n < 0:
        raise ValueError("n must be non-negative")

    result = 1
    for i in range(1, n + 1):
        result *= i
    return result


class CometImpactSimulator:
    def __init__(self, diameter_m, density_kg_m3, speed_m_s):
        self.diameter_m = diameter_m
        self.density_kg_m3 = density_kg_m3
        self.speed_m_s = speed_m_s

    def volume(self):
        r = self.diameter_m / 2
        return 4 / 3 * 3.141592653589793 * r ** 3

    def mass(self):
        return self.volume() * self.density_kg_m3

    def kinetic_energy(self):
        return 0.5 * self.mass() * self.speed_m_s ** 2

    def tnt_megatons(self):
        return self.kinetic_energy() / 4.184e15


sim = CometImpactSimulator(
    diameter_m=1000,
    density_kg_m3=500,
    speed_m_s=100000
)

print("mass =", sim.mass())
print("energy =", sim.kinetic_energy())
print("megatons =", sim.tnt_megatons())

# Backticks inside code block:
text = "This is a `literal backtick` example."
```

---

## Long math block

\[
\begin{aligned}
E &= \frac{1}{2}mv^2 \\
m &= \rho \cdot \frac{4}{3}\pi r^3 \\
r &= \frac{d}{2} \\
E &= \frac{1}{2}\rho \cdot \frac{4}{3}\pi \left(\frac{d}{2}\right)^3 v^2 \\
  &= \frac{1}{2}\rho \cdot \frac{4}{3}\pi \cdot \frac{d^3}{8} \cdot v^2 \\
  &= \frac{\rho \pi d^3 v^2}{12}
\end{aligned}
\]

\[
\begin{aligned}
E_{\text{example}} &= \frac{500 \cdot \pi \cdot (1000)^3 \cdot (100000)^2}{12} \\
&\approx 1.31 \times 10^{21}\ \text{J}
\end{aligned}
\]

---

## Mixed stress sample

1. Item with `inline code` and [a link](https://example.com)
2. Item with **bold**, _italic_, and ~~strike~~
3. Item with
   > a nested quote
   >
   > - a nested list
   > - another nested list
4. Item with `<abbr title="Application Programming Interface">API</abbr>`

---

## Tiny checklist

- [x] markdown
- [x] tables
- [x] footnotes
- [x] details
- [x] HTML
- [x] code
- [x] math
- [x] escaping
