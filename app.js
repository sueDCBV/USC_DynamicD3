var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart, and shift the latter by left and top margins.
var svg = d3.select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .attr("id","chart");

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "POVERTY";

// function used for updating x-scale var upon click on axis label
function xScale(hwData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(hwData, d => d[chosenXAxis]) * 0.8,
      d3.max(hwData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));
  return circlesGroup;
}

function renderLabels(circlesLabels, newXScale, chosenXaxis) {

  circlesLabels.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    //.attr("cy", d => yLinearScale(d.HEALTH_COVERAGE))
    .text(function(d) {d.STATE_ABR})
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("font-size", "10px")
    .attr("fill", "black");
  
  return circlesLabels;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  if (chosenXAxis == "POVERTY") {
    var label = "Poverty Rate:";
  }
  else {
    var label = "Unemployment Rate:";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function(d) {
      return (`${d.STATE}<br>${label} ${d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Import Data
d3.csv("data.csv", function(err, hwData) {
  if (err) throw err;

  // Step 1: Parse Data/Cast as numbers
   // ==============================
  hwData.forEach(function(data) {
    data.HEALTH_COVERAGE = +data.HEALTH_COVERAGE;
    data.POVERTY = +data.POVERTY;
    data.UNEMPLOYMENT = +data.UNEMPLOYMENT;
  });

  // Step 2: Create scale functions
  // ==============================
  // var xLinearScale = d3.scaleLinear()
  //   .domain([5, d3.max(hwData, d => d.POVERTY)])
  //   .range([0, width]);
  var xLinearScale = xScale(hwData, chosenXAxis);

  var yLinearScale = d3.scaleLinear()
    .domain([70, d3.max(hwData, d => d.HEALTH_COVERAGE)])
    .range([height, 0]);

  // Step 3: Create axis functions
  // ==============================
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // Step 4: Append Axes to the chart
  // ==============================
  // chartGroup.append("g")
  //   .attr("transform", `translate(0, ${height})`)
  //   .call(bottomAxis);

  // chartGroup.append("g")
  //   .call(leftAxis);
  
  
  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis);


   // Step 5: Create Circles
  // ==============================
  var circlesGroup = chartGroup.selectAll("circle")
  .data(hwData)
  .enter()
  .append("circle")
  .attr("cx", d => xLinearScale(d[chosenXAxis]))
  .attr("cy", d => yLinearScale(d.HEALTH_COVERAGE))
  .attr("r", "15")
  .attr("fill", "blue")
  .attr("opacity", ".2")
  .text(function(d) {
    return d["STATE_ABR"];
  });

  var circlesLabels = chartGroup.selectAll(null)
  .data(hwData)
  .enter()
  .append("text")
  //.attr("x", d => xLinearScale(d.POVERTY))
  .attr("x", d => xLinearScale(d[chosenXAxis]))
  .attr("y", d => yLinearScale(d.HEALTH_COVERAGE))
  .text(function(d) {return d.STATE_ABR})
  .attr("text-anchor", "middle")
  .attr("dy", ".3em")
  .attr("font-size", "10px")
  .attr("stroke-width", "2px")
  .attr("color", "black");



  // Create group for  2 x- axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "POVERTY") // value to grab for event listener
    .classed("active", true)
    .text("Poverty Rate (%)");

  var unemploymentLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "UNEMPLOYMENT") // value to grab for event listener
    .classed("inactive", true)
    .text("Unemployment Rate (%)");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Health Coverage");


  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value != chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(hwData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        
        // updates circles labels with new x values
        circlesLabels = renderLabels(circlesLabels, xLinearScale, chosenXAxis);
               

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis == "POVERTY") {
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          unemploymentLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          unemploymentLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });


});
