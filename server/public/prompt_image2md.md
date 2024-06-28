# Instructions

Convert the following image to Markdown format.

## Specific Requirements

- **Math Equations:**
    - **Display Equations:** Convert all display math equations to LaTeX format enclosed in `$$ equation $$`.
    - **Inline Equations:** Convert all inline math equations, math symbols, or elements that represent math to LaTeX format enclosed in `$ equation $` or `$ symbol $`.

- **Figures:**
    - **Figure Description:** Add a description of each figure in the format `[figure]description of the figure[/figure]`.
    - **Text Extraction:** Extract all text from figures and convert it to Markdown format. If the figure contains math, represent it using LaTeX math.
    - **Figure Tag:** Create a tag for each figure with the extracted text in the format `[textoffigure]text of figure $ latex math $ [/textoffigure]`.

## Input

- **Image:** [Insert Image URL or upload image file]

## Output

- **Markdown:** Markdown format of the image content with all the specified conversions.

## Example

### Input Image

[Image containing a text paragraph with an inline equation \(x^2\), a display equation \(y = mx + c\), and a figure with text "Figure 1: Example Figure" and the equation \(z = a + b\).]

### Output Markdown

This is a paragraph with an inline equation $x^2$.

$$y = mx + c$$

[figure]Example Figure[/figure]

[textoffigure]Figure 1: Example Figure $z = a + b$[/textoffigure]