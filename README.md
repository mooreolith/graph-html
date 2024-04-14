# graph-html
## (not done yet)

[This](https://mooreolith.github.io/graph-html) is (going to be) a web component encapsulating a [dynamic force directed graph visualization](https://arxiv.org/abs/0712.1549). 
I got the VertexHTML, EdgeHTML and GraphHTML displaying on a THREE.js controlled canvas, with the help of a BarnesHutOctree. 
The dynamic matching is not yet implemented. I left a lot of the writing to GithubCopilot, it's like a Junior Engineer you have to mentor. 
I intend to let GH Copilot rewrite the layout calculations in C++, to be compiled to WebAssembly.

The vertices (currently represented as cubes) will have the following attributes:
* size (for resizing the cubes)
* color (for making the cubes a distinct color)
* source (for displaying images on the cubes)
* label

The edges (lines) will have these attributes:
* color
* strength
* label

The graph has a:
* width
* height
* backgroundcolor

The aim is for these to be controlled by HTML Attribute, CSS Rules, and JavaScript Properties. Changing one should affect the other.
Previous version of this system used Decorators to work off a list of attributes, but that proved less than stable to reason through, 
so I had Copilot simplify this by writing out attributes. I need to double check this work. 

Hidden in the bowels of this graph visualization, you'll find:
* layout.mjs for animating graph-html elements
* bhoctree.mjs for helping layout estimate the next set of positions
* dynamic-matching.mjs for further speeding up layout


