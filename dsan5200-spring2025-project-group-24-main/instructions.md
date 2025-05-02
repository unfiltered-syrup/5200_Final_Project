Over the rest of the semester, you will work towards creating a visual,
interactive, data-driven story. Data storytelling is the process of describing
data by building a compelling narrative around datasets that is supported by
data visualizations.
This adds meaningful context to the data and helps the audience easily
understand the information.

Additionally, data visuals have evolved over the past decade from static charts
and graphs to interactive and immersive visuals. This allows the audience to
modify elements of the data being presented and manipulate the graphical
representation. Static charts and graphs do not have the capability to adjust
the visual, such as hovering, sorting and scaling. Interactive visualizations
allow users to generate transformative insights, identify relationships, view
trends and create meaningful stories through data.

In your work as data scientists, in addition to doing modeling and machine learning work, you will be responsible (either individually or as part of a team) for providing the following as part of a project:

* **Findings:** what does the data say?
* **Conclusions:** what is your interpretation of the data?
* **Recommendations:** what can be done to address the question/problem at hand?

Your narrative will focus primarily on the first two above. The narrative should allow your audience to be able to understand the topic you are analyzing, presenting and discussing.

_We do not expect you to tackle and solve a large scale problem, that is not the objective. However, you are welcome to offer ideas and proposals on the topic you present_. Find a topic of interest, work with the data, and present it to an audience that may not know very much about the subject using a data-driven narrative.

This is your chance to show creativity and have some fun!


## Deliverables

The project will be delivered through an interactive self-contained website. The website and all of your code work will be done in your team's GitHub repository. You will work in the same repository throughout the life of the project.

Think of the entire project as several parts (for different audiences):

* **The story:** a website with the visual narrative. This is the end product for a _general audience_ where you will tell a story using storytelling and visualization techniques to an audience that wants to learn something about your topic.
* **The technical approach:** the collection of code you used to process your data, create the visualizations, and produce the website. _The audience for this piece is mainly the instructors_, however, it is also important to the _general audience_ for reproducibility.
* **The presentation:** at the end of the semester where you will show _the instructors_ and _your classmates_ how to interact with your story and explain your process throughout the semester.

## Overall Requirements

Please read this section carefully. There are requirements for different aspects of the project.

### Narrative

A narrative _is not_ a set of individual comments on every visualization. It _is_ a story with structure, evolution, and flow, where the visualizations are used to support and strengthen the narrative.

### Visualizations

For this project, the visualizations are just as important as the narrative. They must add context to the narrative and allow the audience to learn more about your story by visually understanding and interacting with the data. They should be used to describe and highlight aspects of the data and analyses that you describe in your narrative.

Your final product must include the following elements:

* **At least five unique views**, where a _view_ is a visualization type. A view may also contain multiple plots. For clarification, the following are two examples of what can be considered _5 views_:
    * One choropleth, one bubble-plot, one box-plot, one parallel coordinate plot, and one linked scatter-plot/histogram. This is five views and six plots.
    * Two choropleths, two bubble-plots, one visualization with a 3x3 multi-variable pairplot with histograms on the main diagonal (which is essentially a scatter-plot/histogram), one scatter plot, three linked boxplots/scatterplot, two parallel coordinate plots, and two histograms. This is five views and twenty one plots.

* At least one of these views **must be an attempt of an innovative view**:


#### What **is** innovative
* An extension of an existing visualization type
* A novel visualization type
* Something creative, novel, difficult, interesting, and generally beyond _typical_. It's probably innovative if:
    * You are surprised that you were able to pull it off
    * You are pleasantly surprised by the insights that you’re providing and we learn something unexpected and novel about your data,
    * It's something hard to get working and requires a deep understanding of graphic objects

#### What **is not** innovative
* An interactive visualization
* Something may not be innovative enough if:
    * Getting it to work is _trivial_
    * It's a very common plotting method
    * It can be done with 5 or 10 lines of code
    * We can google it and quickly find a template of the code that generated the plot
    * It was done with plotly express
    * If it is fancy and difficult, but doesn’t tell us anything, or doesn’t make us think about your data, or doesn’t provide some insight about your data in alignment with your narrative, it might be innovative, but it will get penalized under the “graph for graph’s sake” rubric


* At least two linked views. A click/hover/selection interaction within one view must trigger a change in a different view.
* At least one view with interactive tooltips that are shown when users hover over marks. These tooltips must contain information that is not shown in the visualization itself, and must be properly formatted. Tooltips that just show coordinates and colors that are already explained in a legend are not satisfactory.
* A formatted and/or interactive data table that presents part of your data in a pleasant and interactive way.

All views and visualizations must have a purpose!  As a team, repeatedly ask yourselves whether each visualization **deserves** to be included.

Do not create a view just for the sake of meeting a requirement. If a visualization you include does not advance or support the narrative, or just repeats information already presented in another visualization or table, it shouldn't be there, and will be penalized.

In real life, you will often use visualizations to summarize your work, but you have limits placed on the number of visualizations by journals, required formats, and just the time you might have to present your findings. So work on and emphasize **information-rich but succint visualizations that have a purpose and advance a story**.

### Design

You must apply best practices in design:

* Your narrative must have custom theming, look and feel
* Choose appropriate color schemes and keep them consistent
* Add appropriate annotations.
* Your website and visualizations must be as self-documenting as possible, with appropriate labels for panes, axes, and widgets, a legend documenting the meaning of visual encodings, and a meaningful title. Each visualization should also have a number and caption associated with it to help referring to the figure and making the story represented by the figure self-contained.
* Your design choices may  be creative and unconventional as long as they are serving a purpose

### Website

The website must:

* Be self-contained in its own subdirectory within the repository (not the root level) and accessible via an `index.html` file; all required assets must be accessible and available for off-line rendering
* Have navigation tools, allowing the user/visitor to explore all the contents and always know where they are, and return to the starting point
* Show the title of your visual narrative and the team members
* Not require server side components

### Code and Workflow

We expect to see best practices in collaborative development and coding. All team members are expected to contribute to the development of the project.

* All team members must make git commits that are attributed to them
    - Ensure that you have your git [`user.name`](https://docs.github.com/en/get-started/getting-started-with-git/setting-your-username-in-git) and [`user.email`](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address) configured properly with your GU information.
* Use best practices in collaborative workflow (branches, pull requests, merges)
* Make sure that your code is well-organized, documented with comments and easy to read
    - Please use linters and automated stylers to standardize your code. In {{< fa brands r-project >}} you can consider `lintr` and `styler`. In {{< fa brands python >}} you can consider `black`, `isort` and `pylint`.
* Use functions to promote the DRY (Don't Repeat Yourself) principle and code reuse.
* Your repository must be well organized; don't work with a messy repo and then try to clean it up before the final milestone
* Comment your code early and often!
* The instructors must be able to replicate all the pieces of your work and re-render your final product from scratch on their local machines, with knowledge of any virtual environments you might be using.
    - Python virtual environments must be specified via a `environment.yml` or `requirements.txt` that is included in the repo.
    - R virtual environments must use `renv` and an `renv.lock` file must be included in the repo.


## Tools

### Allowed

Your will focus your efforts on the data manipulation, analysis, writing, and presentation using R and Python with their appropriate packages that wrap D3 or its variants and other front-end development tools (JavaScript, D3, HTML, CSS.)

For the website, we encourage the use of [Quarto](https://quarto.org/). However, you may choose the other frameworks build your website **as long as it is reproducible.** Direct HTML editing is not allowed!

* You may use any of the packages and _wrappers_ we discussed in class (this is not an exhaustive list):
    * [`htmlwidgets`](https://www.htmlwidgets.org) package in R
    * [`bokeh`](https://bokeh.org)
    * [`holoviz`](https://holoviz.org) and it's accompanying ecosystem in Python
    * `altair` (in both [R](https://vegawidget.github.io/altair/) and [Python](https://altair-viz.github.io)) as wrappers for Vega-lite
    * Specialized packages for geospatial:
        * [`leaflet`](https://rstudio.github.io/leaflet/) in R
        * [`tmap`](https://geocompr.robinlovelace.net/adv-map.html) in R
        * [`folium`](https://python-visualization.github.io/folium/index.html) in Python
    * [NVD3](https://nvd3.org/)
    * `plotly` (in both [R](https://plotly.com/r) and [Python](https://plotly.com/python)) for wrapping D3.
    * [Observable](https://observablehq.com/), Vega, Vega-Lite
    * [`flexdashboard`](https://pkgs.rstudio.com/flexdashboard/)


If you intend to use a package or tool not discussed in class, you must get prior approval from the instructional team.

* You may choose to develop the whole narrative directly in D3 and JavaScript, however, in class we will be focusing on showing you R and Python wrappers to D3 and JavaScript that will make generating visualizations easier.

* You may use CSS frameworks, such as [Bootstrap](https://getbootstrap.com/), [Materialize](https://materializecss.com/), or [Distill](https://distill.pub/about/) and include external libraries (jQuery, leaflet.js, moment.js, etc.).


### Not allowed

* Any server side or custom backends (Node.js, Python, etc) and database systems, such as Postgres or MySQL.
* [Highcharts JS](https://www.highcharts.com/)
* [Shiny](https://shiny.rstudio.com/)

## Evaluation

The project will be evaluated using the following high-level criteria:

* Analytical approach: are you making sound choices in your analysis? Do the questions you are answering make analytical sense? Are you justifying your analytical decisions and assumptions?
* Visual effectiveness: effectiveness of visualizations and interactions in adding value to your story
* Design effectiveness: effectiveness of design choices
* Level of technical difficulty and quality of implementation
* Whether the visual narrative answers a question, tells a story, and addresses the goals and requirements
* Quality and clarity of your writing
* Overall presentation, including your own visual style

See [the grade brackets in the syllabus](../site-page-content/syllabus.qmd#grading-philosophy) for a detailed description.


The project will have several milestones that are cumulative in nature. Therefore, we will grade the project after the final submission with a holistic project rubric. We will grade the milestones in a qualitative way, and we will provide feedback and a trending grade with each milestone. It is up to you to incorporate the feedback provided. If your milestone trending grade is lower than you expected, and you do not incorporate the feedback we provide for improvement, do not expect your final project grade to improve.

In addition, each team member will complete a peer evaluation for their group and provide feedback to everyone's contribution. Every team member is expected to contribute equally to their project. If peer evaluations indicate that students within a team are not contributing equally, those students will receive a grade penalty and a lower grade than the rest of their team.


