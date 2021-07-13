(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
        (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.scd3 = global.scd3 || {}));
}(this, (function(exports) {
    'use strict';

    var version = "1.0.0";

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
    function createTsneSvg(target, data, style, color_scale = undefined, color_by = 2, stroke_width = 4, onclick = d => d, onleave = d => d) {
        var svg = d3.select(target)
            .append("svg")
            .attr("viewBox", [0, 0, style.width * 1.2, style.height + style.margin.top + style.margin.bottom])
            .attr("width",  0.8 * style.width + style.margin.left + style.margin.right)
            .attr("height", style.height + style.margin.top + style.margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + style.margin.left + "," + style.margin.top + ")");

        var g = svg.append("g")
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
        var x = d3.scaleLinear()
            .domain([-tsne_x_max * 1.2, tsne_x_max * 1.2])
            .range([0, style.width]);

        // Add Y axis
        var y = d3.scaleLinear()
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

    function createViolin(target, data, style, color_scale = undefined, color_by = 2, onclick = d => d, onleave = d => d) {
        var box = d3.select(target)
            .append("svg")
            .attr("class", "graph-svg-component")
            .attr("width", style.width + style.margin.left + style.margin.right)
            .attr("height", (style.height + style.margin.top + style.margin.bottom) * 1)
            .style('text-align', "center")
            .style('margin', "0 auto")
            .style('margin-top', "5rem")
            .append("g")
            .attr("transform",
                "translate(" + style.margin.left + "," +style.margin.top + ")");

        function kernelDensityEstimator(kernel, X) {
            return function(V) {
                return X.map(function(x) {
                    return [x, d3.mean(V, function(v) { return kernel(x - v); })];
                });
            };
        }

        function kernelEpanechnikov(k) {
            return function(v) {
                return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
            };
        }


        var box_x = d3.scaleBand()
            .range([0, style.width])
            .domain(data.map(d => d[2]))
            .padding(1)

        var x = d3.scaleLinear()
            .domain(data.map(d => d[2]))
            .range([0, style.width]);

        var box_y = d3.scaleLinear()
            .domain([0, 5]) // Note that here the Y scale is set manually
            .range([0, (style.height + style.margin.top + style.margin.bottom) * 0.5])

        box.append("g").call(d3.axisLeft(box_y).ticks(5)).style('font-size', '12pt')

        box.append("g")
            .attr("transform", "translate(0," + (style.height + style.margin.top + style.margin.bottom) * 0.5 + ")")
            .call(d3.axisBottom(box_x))
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")
            .style('font-size', '10pt')

        var kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(50)) // increase this 40 for more accurate density.
        var max_num = 0;

        var hist = Array();
        Array.from(d3.rollup(data, v => Array.from(v, d => parseFloat(d[d.length - 1])), d => d[2]).entries()).map(
            function(d) {
                var bin = d3.bin();
                var bin_value = bin(d[1]);
                bin_value.cluster_id = d[0]
                hist.push({ "key": d[0], "value": bin_value })
            });

        var xNum = d3.scaleLinear()
            .range([-20, 20])
            .domain([-20, 20])
        
        var violin_max = 0
        Object.values(hist).map(d => d["value"].map(x => x.length)).flat().map(d => {
            if (d > violin_max) violin_max = d;
        })
        var violin_scale = 20 / violin_max;
        
        if (!color_scale) {
            color_scale = d3.scaleOrdinal().domain(data.map(d => d[2])).range(d3.schemeCategory10);
        }

        box.append("g")
            .attr("transform", "translate(0," + (style.height + style.margin.top + style.margin.bottom) * 0.5 + ")")
            .call(d3.axisBottom(box_x))
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")
            .style('font-size', '10pt')

        var jitterWidth = 5;

        box
            .selectAll("indPoints")
            .data(data)
            .enter()
            .append("circle")
            .style("cursor", "pointer")
            .attr("cx", function(d) { return (box_x(d[2]) - jitterWidth / 2 + Math.random() * jitterWidth) })
            .attr("cy", function(d) { return (box_y(parseFloat(d[d.length - 1]))) })
            .attr("r", 1)
            .style("stroke", "black")
            .style("stroke-width", "0.5")
            .style("fill", color_scale(d => d[2]))
            .style("fill", "#7F7F7F")

        box
            .selectAll("violin")
            .data(hist)
            .enter() // So now we are working group per group
            .append("g")
            .attr("transform", function(d) { return ("translate(" + box_x(d.key) + " ,0)") }) // Translation on the right to be at the group position
            .append("path")
            .style("cursor", "pointer")
            .datum(function(d) { return (d.value) }) // So now we are working bin per bin
            .attr("class", "violin-path")
            .style("stroke", "black")
            .style("stroke-width", "0.5")
            .style("fill", function(d) { return color_scale(d.cluster_id) })
            .style("opacity", "0.5")
            .attr("d", d3.area()
                .x0(function(d) { return (xNum(-d.length * violin_scale)) })
                .x1(function(d) { return (xNum(d.length * violin_scale)) })
                .y(function(d) { return (box_y(d.x0)) })
                .curve(d3.curveCatmullRom) // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
            )

        return box;
    }

    exports.createTooltip = createTooltip;
    exports.createTsneSvg = createTsneSvg;
    exports.createViolin = createViolin;
    Object.defineProperty(exports, '__esModule', { value: true });
})));