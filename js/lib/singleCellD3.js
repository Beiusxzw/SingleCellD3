var d3_style = {
    margin: {
        top: 10,
        right: 30,
        bottom: 30,
        left: 60
    },
    width: 400,
    height: 400,
    class_scale_orginal: undefined,
    expression_scale_continuous: d3.scaleSequential().domain([0, 5]).range(["#f7f7f7", "blue"])
}

/**
 * @Description Create a tooltip element
 * @Author Snow
 * @Date 2021-07-09
 * @Version 1.0
 * @Param {String} target  target element name, same as Jquery
 * @Return {Object} 
 */ 
function createTooltip(target) {
    var tooltip = d3.select(target).append("div")
        .attr("class", "d3tooltip")
    return tooltip
}

/**
 * @Description Create a svg element of tSNE chart
 * @Author Snow
 * @Date 2021-07-09
 * @Version 1.0
 * @Param {String} target  target element name, same as Jquery
 * @Param {Array} data  Array of tSNE coordinates. 
 *                First and second elements be tSNE-1 and tSNE-2
 *                The third column should be the class of the single cell
 *                Other columns could be specified by the 
 * @Param {Object} style  style of the chart.
 * @Param {Function} color_scale  function converting an element to a color
 * @Param {Int} color_by  which column to color by
 * @Param {Float} stroke_width  line width of the point
 * @Param {Function} onclick  mouse onclick callback
 * @Param {Function} onleave  mouse onleave callback
 * @Return {Object} svg g element
 */
function create_tsne_svg(target, data, style, color_scale = undefined, color_by = 2, stroke_width = 4, onclick = d => d, onleave = d => d) {
    svg = d3.select(target)
        .append("svg")
        .attr("viewBox", [0, 0, style.width * 1.2, style.height + style.margin.top + style.margin.bottom])
        .attr("width",  0.8 * style.width + style.margin.left + style.margin.right)
        .attr("height", style.height + style.margin.top + style.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + style.margin.left + "," + style.margin.top + ")");

    g = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-linecap", "round");

    var tsne_x = data.map(d => parseFloat(d[0]));
    var tsne_y = data.map(d => parseFloat(d[1]));
    var tsne_x_max = 0;
    var tsne_y_max = 0;

    if (!color_scale) {
        color_scale = d3.scaleOrdinal().domain(data.map(d => d[2])).range(d3.schemeCategory10);
    }

    tsne_x.map(function(d, i) {
        if (Math.abs(d) > tsne_x_max) tsne_x_max = Math.abs(d);
    })
    tsne_y.map(function(d, i) {
        if (Math.abs(d) > tsne_y_max) tsne_y_max = Math.abs(d);
    })

    // Add X axis
    x = d3.scaleLinear()
        .domain([-tsne_x_max * 1.2, tsne_x_max * 1.2])
        .range([0, style.width]);

    // Add Y axis
    y = d3.scaleLinear()
        .domain([-tsne_y_max * 1.2, tsne_y_max * 1.2])
        .range([style.height, 0]);

    g.selectAll("path")
        .data(data)
        .join("path")
        .style("cursor", "pointer")
        .attr("class", "tsne-circle")
        .attr("d", d => `M${x(parseFloat(d[0]))},${y(parseFloat(d[1]))}h0`)
        .attr("stroke", d => color_scale(d[color_by]))
        .attr("stroke-width", function(d) { return stroke_width; });

    g.selectAll("path").on('click', function(d, i) {
            d3.select(this).transition()
                .duration('100')
                .attr("stroke-width", stroke_width * 2);
            onclick(d);
        }).on('mouseout', function(d, i) {
                d3.select(this).transition()
                    .duration('20')
                    .attr("stroke-width", stroke_width);
                onleave(d);
            }
        );
        
    return g;
}


