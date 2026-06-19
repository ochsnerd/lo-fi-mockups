# Low Fidelity Mockups

The goal of this project is to create a tool for low fidelity UI mockups. The focus is on quickly sketching a UI. In addition, it allows the creation of some basic UML diagrams. The use of master pages reduces repetition and allows for consistent design across multiple pages. It runs completely in the browser.

Test it out at https://ruediste.github.io/lo-fi-mockups/
Download the [Sample Project](doc/sample.lofi) and upload it in the app to see a sample mockup with various features. PDF export of the sample project: [sample.pdf](doc/sample.pdf)

## Screenshots

![Screenshot](doc/screenshot.png)

Sample Diagram:
![Diagram](doc/sample-diagram.png)

## Manual

### Keyboard Reference

- While dragging, holding the ctrl-key disables snapping
- Ctrl-click on an element to select multiple elements
- Ctrl-drag to draw a selection rectangle
- Hold shift to draw new connectors

### User Interface Overview

The user interface is divided into several key sections:

- **Pages Panel:** This panel allows you to manage different pages within your mockup project.
- **Palette:** The Palette contains a collection of pre-defined UI elements that you can add to your mockup.
- **Editor:** The area where you arrange and edit the UI elements to create your mockup.
- **Properties Panel:** This panel displays and allows you to modify the properties of the currently selected UI element.
- **Top Bar:** Contains buttons for actions like "Play", "Download", and "Upload", along with the application title "LoFi Mockup".

### Offline Usage and Installation

The application is a PWA and can be installed locally. For Chrome/Edge simply open https://ruediste.github.io/lo-fi-mockups/ and click install in the address bar. For Firefox, you might need to install https://addons.mozilla.org/en-US/firefox/addon/pwas-for-firefox/

Alternatively, you can just add a bookmark. The application will launch happily while you're offline.

### Native Application

The application can also be built using "neutralino.js".

To associate the file types with the application, install the mime type description:

```
cp lofi-mime-types.xml ~/.local/share/mime/packages
update-mime-database ~/.local/share/mime/
```

### Working with Pages

The Pages panel allows you to structure your design into distinct sections or screens, making it easier to navigate and manage complex projects.

A key concept within the Pages panel is the ability for every page to have a designated master page. A master page acts as a template or a base layer for other pages. When a page is assigned a master page, the elements present on the master page are also displayed on the child page. However, these elements inherited from the master page are not directly editable on the child page. This ensures consistency across multiple pages that share a common layout or set of elements.

While the elements from a master page are generally not editable on a child page, there is a mechanism to override this limitation for specific properties. Properties of elements on a master page can be "unlocked" for child pages. This action, performed within the properties panel, makes those specific properties overrideable on the child page while the rest of the element remains controlled by the master page. This is particularly useful for scenarios where you want to maintain a consistent layout defined on the master page but need to adjust certain aspects, such as text content or image sources, on individual child pages.

This ability to unlock properties is especially beneficial for creating layouts and defining the page structure on a master page. You can design a foundational layout with elements like headers, footers, sidebars, or content containers on a master page. Then, on child pages, you can unlock specific properties of these layout elements to change their content or appearance as needed, while the overall structure remains consistent with the master.

Furthermore, elements placed directly on a child page can snap to elements from the master page. This snapping functionality aids in precise alignment and positioning, allowing you to easily arrange child page elements in relation to the master page layout.

The concept of master pages is also transitive. This means that if a master page itself has a master page, the elements from that higher-level master page will also be displayed on the original child page. This creates a hierarchical structure where changes to a master page can propagate down through multiple levels of child pages, ensuring a high degree of consistency and making global design updates more efficient.

### Using the Palette

The Palette provides a variety of common UI elements that you can drag and drop onto the Editor. Examples of available elements include List items, Tabs, Buttons, Titles, Labels, and Text Inputs.

### Editor Functionality

The Editor is where you visually construct your mockup by arranging elements from the Palette. You can select, move, and resize elements within the editor. A key feature of the editor is the snapping functionality, which helps align elements precisely. When moving elements they will snap to other stationary elements to aid in alignment. There are three types of snapping:

- **Edge Snapping:** Elements generate snap boxes along their edges. When a moving element's edge comes close to these lines, it will snap into alignment.
- **Margin Snapping:** Elements create snap boxes at a specified distance (margin) from their edges. Moving elements will snap their references to these margin lines.
- **Middle Snapping:** Elements provide a snap box through their center line. Moving elements will snap their center reference to this line.

### Properties Panel

The Properties panel displays the configurable attributes of the currently selected element in the Editor. You can use this panel to change properties such as text, labels, colors, and other element-specific settings.

### Links and Play

You can set links to pages on most page elements. If click on play, the current page is shown full screen, and you can navigate between the pages based on the link set on the elements.

### Download Upload

- **Download:** This button allows you to download your mockup project.
- **Upload:** This button allows you to upload an existing mockup project file.

### Data Grid

The Data Grid widget allows you to display tabular data. The content and structure of the data grid are defined by the "Grid Contents" property, which accepts a string input. This input string is parsed to determine the rows, columns, and cell values of the grid.

There are two modes for defining the grid content: Simple and Complex.

**Simple Mode:**

In Simple Mode, each line of the input string represents a row in the data grid. Cells within a row are separated by tab characters (`\t`). The first line of the input should _not_ start with an exclamation mark (`!`).

Example Simple Mode input:

```

H1 H2
R1C1 R1C2
R2C1 R2C2

```

**Complex Mode:**

Complex Mode provides more control over column and row properties, such as sizing and marking rows/columns as headers. To use Complex Mode, the first line of the input string must start with an exclamation mark (`!`).

The first line defines the columns. The first cell (`!`) is a marker for Complex Mode and is ignored for column definition. Subsequent cells in the first line define the properties of each column, separated by tabs. Column properties can include:

- `auto`: The column will automatically size to fit its content.
- `<number>fr`: The column will take up a flexible fraction of the available space (e.g., `1fr`, `2fr`).
- `<number>px`: The column will have a fixed size in pixels (e.g., `100px`).
- `h` or `H`: Marks the column as a header column. Header columns have a different background color.

Multiple properties for a single column can be combined in its definition cell (e.g., `1fr h`).

Subsequent lines in Complex Mode define the rows and their cell contents. The first cell of each row line can define row properties, similar to column properties:

- `auto`: The row will automatically size to fit its content.
- `<number>fr`: The row will take up a flexible fraction of the available space.
- `<number>px`: The row will have a fixed size in pixels.
- `h` or `H`: Marks the row as a header row. Header rows have a different background color.
- `s` or `S`: Marks the row as selected using a different background color.

Multiple properties for a single row can be combined in its definition cell (e.g., `auto h`).

The remaining cells in a row line, separated by tabs, contain the cell content for that row.

Example Complex Mode input:

```

! 1fr h auto 100px
h R1C1 R1C2 R1C3
auto R2C1 R2C2 R2C3

```

## Architecture

There are two model layer: the data layer, for example `ProjectData`, and the domain layer, for example `Project`. The data layer is can be directly serialized as JSON. The domain layer contains all the functionality required for the UI, which is written in React. The domain layer emits events, which are observed by the react components to trigger UI updates.

## Snapping

When moving elements on the page, they snap to each other. There are three snapping types: edge snapping, margin snapping and middle snapping. For each snapping type, the elements create snap boxes and snap references. The snap boxes have a certain size. While moving, the boxes of the stationary elements are matched against the snap references of the moving elements.

Edge snapping means that each element generates snapping boxes at it's edges, going out from the edges. When an element is moved, it's edges snap to those lines.

For margin snapping, each element creates snap boxes with a distance (margin) from it's edges. The snap references of the moving elements snaps are placed identical to the snap boxes.

For middle snapping, elements provide a snap box through their middle, which expands outside of the element. The snap reference is contained within the element.

```

```

## Nix

The file `flake.nix` allows 3 things:
- `nix develop` opens a shell with all dependencies installed to develop the app
- `nix build` compiles an executable of the app
- `nix run` compiles and runs the app

## Tauri

[Tauri](https://tauri.app/) allows bundling web-app as binaries for desktop and mobile.
The required sourcecode lives in src-tauri, including a seperate README.md.

