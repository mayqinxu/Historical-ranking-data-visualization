/**
 * @type Jannchie
 * @email jannchie@gmail.com
 * @create date 2018-05-02 13:17:10
 * @modify date 2018-11-29 13:03:59
 * @desc 可视化核心代码
 */
// import * as d3 from 'd3';
// require("./stylesheet.css");
$('#inputfile').change(function () {
    $('#inputfile').attr('hidden', true);
    $('#title_1').attr('hidden', true);
    $('#title_label').attr('hidden', true);
    $('#Usecount_label').attr('hidden', true);
    $('#Usecount_1').attr('hidden', true);
    $('#Usesemi_label').attr('hidden', true);
    $('#Usesemi_1').attr('hidden', true);
    $('#Bigval_label').attr('hidden', true);
    $('#Bigval_1').attr('hidden', true);
    var r = new FileReader();
    r.readAsText(this.files[0], config.encoding);
    r.onload = function () {
        //读取完成后，数据保存在对象的result属性中
        var data = d3.csvParse(this.result);
        try {
            draw(data);
        } catch (error) {
            alert(error)
        }
    }
});
// 色彩由http://tools.medialab.sciences-po.fr/iwanthue/生成
const colorList = ["#8f9bf2",
    "#d1b753",
    "#7f4cc8",
    "#b5d266",
    "#e18adc",
    "#74d37f",
    "#f27e94",
    "#55dcba",
    "#ea9351",
    "#3bbbf0"];
var nameToColor = {};
var isColorUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function draw(data) {
    var date = [];
    data.forEach(element => {
        if (date.indexOf(element["date"]) == -1) {
            date.push(element["date"]);
        }
    });
    let rate = [];
    var auto_sort = config.auto_sort;
    if (auto_sort) {
        var time = date.sort((x, y) => new Date(x) - new Date(y));
    } else {
        var time = date;
    }
    var use_semilogarithmic_coordinate = config.use_semilogarithmic_coordinate;
    var big_value = config.big_value;
    var divide_by = config.divide_by;
    var name_list = []
    var changeable_color = config.changeable_color;
    data.sort((a, b) => Number(b.value) - Number(a.value)).forEach(e => {
        if (name_list.indexOf(e.name) == -1) {
            name_list.push(e.name)
        }
    })

    var colorRange = d3.interpolateCubehelix("#003AAB", "#01ADFF")

    // 选择颜色
    function getColor(d) {
        var r = 0.00;
        if (changeable_color) {
            var v = Math.abs(rate[d.name] - rate['MIN_RATE']) / (rate['MAX_RATE'] - rate['MIN_RATE'])
            if (isNaN(v) || v == -1) {
                return colorRange(0.6)
            }
            return colorRange(v)
        }

        if (d[divide_by] in config.color)
            return config.color[d[divide_by]]
        else {
            if (nameToColor.hasOwnProperty(d[divide_by])) {
                return colorList[nameToColor[d[divide_by]]];
            }
            let beginId = Math.floor(Math.random() * 10);
            let colorFound = false;
            for (let i = beginId; i < beginId + 10; ++i) {
                if (isColorUsed[i % 10] == 0) {
                    nameToColor[d[divide_by]] = i % 10;
                    isColorUsed[i % 10] = 1;
                    colorFound = true;
                    break;
                }
            }
            if (!colorFound) {
                console.error(`Color not Found for data ${d[divide_by]}!`);
            }
            return colorList[nameToColor[d[divide_by]]];
        }
    }

    var showMessage = config.showMessage;
    var allow_up = config.allow_up;
    var interval_time = config.interval_time;
    var itemLabel = config.itemLabel;
    var typeLabel = config.typeLabel;
    var Title = config.Title;
    // 长度小于display_barInfo的bar将不显示barInfo
    var display_barInfo = config.display_barInfo;
    // 显示类型
    if (divide_by != 'name') {
        var use_type_info = true;
    } else {
        var use_type_info = false;
    }
    // 使用计数器
    var use_counter = config.use_counter;
    // 每个数据的间隔日期
    var step = config.step;
    var long = config.long;
    var format = config.format;
    var left_margin = config.left_margin;
    var right_margin = config.right_margin;
    var top_margin = config.top_margin;
    var bottom_margin = config.bottom_margin;
    var timeFormat = config.timeFormat;
    var max_number = config.max_number;
    var reverse = config.reverse;
    var animation = config.animation;

    var enter_from_0 = config.enter_from_0;
    // 时间窗口大小
    var timeWindowSize = 5;
    interval_time /= 3;
    var lastData = [];
    var currentdate = time[0].toString();
    var currentData = [];
    var visibleData = {};
    const svg = d3.select('svg');

    // svg实际宽度
    const width = $('svg').width();
    //console.log(width);
    // svg实际高度
    const height = $('svg').height();
    // 图表左右上下间距
    const margin = {
        left: 0.1 * width,
        right: 0.1 * width,
        top: 0.2 * height,
        bottom: 0.2 * height
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    var dateLabel_y = height - margin.top - margin.bottom;
    var text_y = -0.05 * innerHeight;
    // 榜首项目信息的水平位置
    var item_x = 0.3 * innerWidth;
    // 右侧文字横坐标
    var text_x = 0.4 * innerWidth;
    // 偏移量
    var offset = 0.1 * innerWidth;
    const xValue = d => Number(d.value);
    const yValue = d => d.name;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left + 0.5 * innerWidth}, ${margin.top})`);
    var currentStartDate = new Date(currentdate);
    var currentEndDate = new Date(currentdate);
    currentEndDate.setDate(currentEndDate.getDate() + timeWindowSize);
    const xAxisG = g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`);
    const yAxisG = g.append('g');

    xAxisG.append('text')
        .attr('class', 'axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', 100);

    var linexScale = d3.scaleTime()
        .domain([currentStartDate, currentEndDate])
        .range([0, 0.4 * innerWidth]);
    var lineyScale = d3.scaleBand()
        .domain([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
        .range([innerHeight, 0])
        .paddingInner(0.3)
        .paddingOuter(0);
    const lineyAxis = d3.axisLeft(lineyScale)
        .tickPadding(5)
        .tickSize(-innerWidth * 0.45);
    const linexAxis = d3.axisBottom(linexScale)
        .ticks(5).tickFormat(d3.timeFormat(timeFormat));

    function lineX(dateStr) {
        return linexScale(new Date(dateStr)) - 0.5 * innerWidth;
    }

    function lineY(rank) {
        return innerHeight - lineyScale.bandwidth() / 2 - lineyScale(9 - rank);
    }

    var line = d3.line()
    //.curve(d3.curveMonotoneX)
        .curve(d3.curveLinear)
        .x(function (d) {
            return lineX(d.date);
        })
        .y(function (d) {
            return lineY(d.rank);
        });

    const linexAxisG = g.append("g")
        .attr("transform", `translate(${-0.5 * innerWidth}, ${innerHeight})`)
        .call(linexAxis)
        .style("fill", "black");
    g.append("g")
        .attr("transform", `translate(${-0.5 * innerWidth}, 0)`)
        .call(lineyAxis);
    var xScale = d3.scaleLinear()
    if (use_semilogarithmic_coordinate) {
        xScale = d3.scalePow().exponent(.5);
    } else {
        xScale = d3.scaleLinear();
    }
    const yScale = d3.scaleBand()
        .paddingInner(0.3)
        .paddingOuter(0);

    const xTicks = 10;
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(xTicks)
        .tickPadding(20)
        .tickFormat(d => {
            if (d == 0) {
                return '';
            }
            return d;
        })
        .tickSize(-innerHeight);

    const yAxis = d3.axisLeft()
        .scale(yScale)
        .tickPadding(5)
        .tickSize(-innerWidth);

    var dateLabel = g.insert("text")
        .data(currentdate)
        .attr("class", "dateLabel")
        .attr("x", innerWidth * 0.5)
        .attr("y", innerHeight).attr("text-anchor", function () {
            return 'end';
        })

        .text(currentdate);

    var topLabel = g.insert("text")
        .attr("class", "topLabel")
        .attr("x", 0)
        .attr("y", text_y)

    function dataSort() {
        if (reverse) {
            currentData.sort(function (a, b) {
                if (Number(a.value) == Number(b.value)) {
                    var r1 = 0;
                    var r2 = 0;
                    for (let index = 0; index < a.name.length; index++) {
                        r1 = r1 + a.name.charCodeAt(index);
                    }
                    for (let index = 0; index < b.name.length; index++) {
                        r2 = r2 + b.name.charCodeAt(index);
                    }
                    return r2 - r1;
                } else {
                    return Number(a.value) - Number(b.value);
                }
            });
        } else {
            currentData.sort(function (a, b) {
                if (Number(a.value) == Number(b.value)) {
                    var r1 = 0;
                    var r2 = 0;
                    for (let index = 0; index < a.name.length; index++) {
                        r1 = r1 + a.name.charCodeAt(index);
                    }
                    for (let index = 0; index < b.name.length; index++) {
                        r2 = r2 + b.name.charCodeAt(index);
                    }
                    return r2 - r1;
                } else {
                    return Number(b.value) - Number(a.value);
                }
            });
        }
    }

    function getCurrentData(date) {
        rate = [];
        currentData = [];
        data.forEach(element => {
            if (element["date"] == date && parseFloat(element['value']) != 0) {
                currentData.push(element);
            }
        });

        rate['MAX_RATE'] = 0;
        rate['MIN_RATE'] = 1;
        currentData.forEach(e => {
            _cName = e.name
            lastData.forEach(el => {
                if (el.name == e.name) {
                    rate[e.name] = Number(Number(e.value) - Number(el.value));
                }
            });
            if (rate[e.name] == undefined) {
                rate[e.name] = rate['MIN_RATE'];
            }
            if (rate[e.name] > rate['MAX_RATE']) {
                rate['MAX_RATE'] = rate[e.name]
            } else if (rate[e.name] < rate['MIN_RATE']) {
                rate['MIN_RATE'] = rate[e.name]
            }
        })
        currentData = currentData.slice(0, max_number);

        d3.transition("2")
            .each(redraw)
            .on("end", d => {
                lastData = currentData;

            });

    }

    if (showMessage) {

        // 左1文字
        var topInfo = g.insert("text")
            .attr("class", "growth")
            .attr("x", 0)
            .attr("y", text_y).text(itemLabel);

        var title_y = -0.2 * innerHeight;
        var title_x = -Title.length * 0.009 * width;
        g.insert("text")
            .attr("class", "TITLE")
            .attr("x", title_x)
            .attr("y", title_y).text(Title);

        // 右1文字
        g.insert("text")
            .attr("class", "growth")
            .attr("x", 500)
            .attr("y", text_y).text(typeLabel);

        // 榜首日期计数
        if (use_counter == true) {
            var day = g.insert("text")
                .attr("class", "count")
                .attr("x", item_x)
                .attr("y", text_y);
        }
        // 显示榜首type
        if (use_type_info == true) {
            var top_type = g.insert("text")
                .attr("class", "days")
                .attr("x", 0)
                .attr("y", text_y)
                .attr("text-anchor", "end");
        }
    }

    var lastname;
    var counter = {
        "value": 1
    };

    var avg = 0;

    function redraw() {

        if (currentData.length == 0) return;
        yScale
            .domain(currentData.map(d => d.name).reverse())
            .range([innerHeight, 0]);
        // x轴范围
        // 如果所有数字很大导致拉不开差距

        if (big_value) {
            xScale.domain([2 * d3.min(currentData, xValue) - d3.max(currentData, xValue), d3.max(currentData, xValue) + 10]).range([0, innerWidth / 2]);
        } else {
            xScale.domain([0, d3.max(currentData, xValue) + 1]).range([0, innerWidth / 2]);
        }
        if (auto_sort) {

            dateLabel.data(currentData).transition().duration(3000 * interval_time).ease(d3.easeLinear).tween(
                "text",
                function (d) {
                    var self = this;
                    var i = d3.interpolateDate(new Date(self.textContent), new Date(d.date))
                    // var prec = (new Date(d.date) + "").split(".");
                    // var round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
                    return function (t) {
                        var dateformat = d3.timeFormat(timeFormat)
                        self.textContent = dateformat(i(t));
                    };
                });

        } else {
            dateLabel.text(currentdate);
        }

        xAxisG.transition().duration(3000 * interval_time).ease(d3.easeLinear).call(xAxis);
        yAxisG.transition().duration(3000 * interval_time).ease(d3.easeLinear).call(yAxis);

        yAxisG.selectAll('.tick').remove();

        var bar = g.selectAll(".bar")
            .data(currentData, function (d) {
                return d.name;
            });
        var path = g.selectAll(".paths")
            .data(currentData, function (d) {
                return d.name;
            });
        var connection = g.selectAll(".cnkts")
            .data(currentData, function (d) {
                return d.name;
            });

        if (showMessage) {
            // 榜首文字
            topLabel.data(currentData).text(function (d) {
                if (lastname == d.name) {
                    counter.value = counter.value + 1;
                } else {
                    counter.value = 1;
                    //console.log(counter.value);
                }
                lastname = d.name
                return d.name;
            });


            if (use_counter == true) {
                // 榜首持续时间更新
                console.log(counter.value);
                day.data(currentData).text(function (d) {
                    return "连续" + counter.value / step + "天第一"
                });
                /*
                day.data(currentData).transition().duration(3000 * interval_time).ease(d3.easeLinear).tween(
                    "text",
                    function (d) {
                        var self = this;
                        var i = d3.interpolate(self.textContent, counter.value),
                            prec = (counter.value + "").split("."),
                            round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
                        return function (t) {
                            self.textContent = d3.format(format)(Math.round(i(t) * round) / round);
                        };
                    });*/
            }
            if (use_type_info == true) {
                // 榜首type更新
                top_type.data(currentData).text(function (d) {
                    return d['type']
                });
            }
        }
        var prevTotalLength = {};

        function remeasureLength() {
            g.selectAll(".linepath").call(function (element) {
                element.each(function (d) {
                    prevTotalLength[d.name] = this.getTotalLength();
                    //console.log(this.getTotalLength());
                });
            });
        }

        remeasureLength();
        // 超出窗口，窗口（折线图x轴）开始滑动
        var newDate = new Date(currentdate);
        if (currentEndDate < newDate) {
            currentEndDate = new Date(currentdate);
            currentStartDate = new Date(currentdate);
            currentStartDate.setDate(currentStartDate.getDate() - timeWindowSize);
            //console.log(currentStartDate);
            //console.log(currentEndDate);
            // 修改比例尺
            linexScale.domain([currentStartDate, currentEndDate])
                .range([0, innerWidth * 0.45]);
            // 删除超出范围的数据
            for (let item in visibleData) {
                //console.log(visibleData[item][0]["date"]);
                while (visibleData[item].length > 0 && currentStartDate > new Date(visibleData[item][0]["date"])) {
                    visibleData[item].shift();
                    //console.log(1);
                }
            }
        }

        // 顺序：
        // update所有路径移动 => 重新计算update路径长度 延伸
        // 坐标轴移动         =>
        // 先update再enter，否则刚enter的元素会被再次放进update中


        linexAxisG.transition("pathchange")
            .duration(1500 * interval_time)
            .ease(d3.easeLinear)
            .call(linexAxis);
        pUpdate();
        pExit();
        pEnter();

        // 此处有bug：两个update都改了d属性（即绑定的数组），但是第二次修改应当在第一个transition结束之后进行，并且修改
        function pUpdate() {
            var pathUpdate = path.select(".linepath");
            // 可能被截短
            pathUpdate
                .attr("d", function (d, i) {
                    return line(visibleData[d.name]);
                })
                .attr("stroke-dashoffset", function (d) {
                    //console.log(2);
                    prevTotalLength[d.name] = this.getTotalLength();
                    return 100000 - this.getTotalLength();
                });
            // 变长
            pathUpdate
                .attr("d", function (d, i) {
                    //if (d.name == "I")
                    //console.log(2);
                    visibleData[d.name].push({date: currentdate, rank: i});
                    return line(visibleData[d.name]);
                })
                .transition("2").ease(d3.easeLinear).duration(2900 * interval_time)
                .attr("opacity", (d, i) => (i < 3) ? 1 : 0.16)
                .attr("stroke-dashoffset", function (d) {
                    //console.log(2);
                    //console.log(this.getTotalLength());
                    return 100000 - this.getTotalLength();
                });
            var cnktUpdate = connection.select(".linecnkt")
                .attr("x1", function (d) {
                    var prevDate = new Date(currentdate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    //console.log(prevDate);
                    if (prevDate < currentStartDate) {
                        prevDate = new Date(currentStartDate.getTime());
                    }
                    return lineX(prevDate.toString());
                })
                .transition("2").ease(d3.easeLinear).duration(2900 * interval_time)
                .attr("opacity", (d, i) => (i < 3) ? 1 : 0.16)
                .attr("x1", lineX(currentdate))
                .attr("y1", (d, i) => lineY(i))
                .attr("y2", (d, i) => lineY(i))
        }

        //console.log(pathUpdate.select(".linepath").getTotalLength());
        function pEnter() {
            var pathEnter = path.enter().append("g").attr("class", "paths");
            pathEnter.append("path")
                .attr("stroke-dasharray", 100000)
                .attr("stroke-dashoffset", 100000)
                .attr("class", "linepath")
                .attr("d", function (d, i) {
                    visibleData[d.name] = [];
                    //if (d.name == "I")
                    var prevDate = new Date(currentdate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    //console.log(prevDate);
                    if (prevDate < currentStartDate) {
                        prevDate = new Date(currentStartDate.getTime());
                    }
                    //console.log(prevDate.toString());

                    visibleData[d.name].push({date: prevDate.toString(), rank: max_number - 1});
                    visibleData[d.name].push({date: currentdate, rank: i});
                    //console.log(d);
                    //console.log(i);
                    return line(visibleData[d.name]);
                })
                .attr("stroke", d => getColor(d))
                .attr("stroke-width", 4)
                .attr("opacity", 0)
                .attr("fill", "none")
                .transition("2")
                .ease(d3.easeLinear)
                .duration(2900 * interval_time)
                .attr("opacity", (d, i) => (i == 0) ? 1 : 0.16)
                .attr("stroke-dashoffset", function (d) {
                    return 100000 - this.getTotalLength();
                });
            var cnktEnter = connection.enter().append("g").attr("class", "cnkts");
            cnktEnter.append("line")
                .attr("class", "linecnkt")
                .attr("x1", function (d) {
                    var prevDate = new Date(currentdate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    //console.log(prevDate);
                    if (prevDate < currentStartDate) {
                        prevDate = new Date(currentStartDate.getTime());
                    }
                    return lineX(prevDate.toString());
                })
                .attr("y1", lineY(max_number - 1))
                .attr("x2", 0)
                .attr("y2", lineY(max_number - 1))
                .attr("stroke", d => getColor(d))
                .attr("stroke-dasharray", innerWidth / 80)
                .attr("stroke-width", 2)
                .attr("opacity", 0)
                .transition("2")
                .ease(d3.easeLinear)
                .duration(2900 * interval_time)
                .attr("opacity", (d, i) => (i == 0) ? 1 : 0.16)
                .attr("x1", lineX(currentdate))
                .attr("y1", (d, i) => lineY(i))
                .attr("y2", (d, i) => lineY(i));
        }

        // exit一定要记得remove空的DOM元素
        // 以及删除颜色对应
        function pExit() {
            path.exit().select("path")
                .attr("d", function (d, i) {
                    //console.log(d);
                    //if (d.name == "I")
                    //console.log(3);
                    isColorUsed[nameToColor[d.name]] = 0;
                    delete nameToColor[d.name];
                    visibleData[d.name].push({date: currentdate, rank: 9});
                    return line(visibleData[d.name]);
                });
            var pathExit = path.exit().transition().ease(d3.easeLinear)
                .duration(2500 * interval_time);

            pathExit.select("path")
                .attr("opacity", 0)
                .attr("stroke-dashoffset", function (d) {
                    return 100000 - this.getTotalLength();
                });
            pathExit.remove();
            var cnktExit = connection.exit().transition().ease(d3.easeLinear)
                .duration(2500 * interval_time);
            cnktExit.select("line")
                .attr("opacity", 0)
            cnktExit.remove();
        }

        var barEnter = bar.enter().insert("g", ".axis")
            .attr("class", "bar")
            .attr("transform", function (d) {
                return "translate(0," + yScale(yValue(d)) + ")";
            });

        barEnter.append("rect").attr("width",
            function (d) {
                if (enter_from_0) {
                    return 0;
                } else {
                    return xScale(currentData[currentData.length - 1].value);
                }
            }).attr("fill-opacity", 0)
            .attr("height", innerHeight / 18).attr("y", 50)
            .style("fill", d => getColor(d))
            .transition("a")
            .delay(500 * interval_time)
            .duration(2490 * interval_time)
            .attr("y", 0).attr(
            "width", d =>
                xScale(xValue(d)))
            .attr("fill-opacity", 1);

        barEnter.append("text").attr("y", 50).attr("fill-opacity", 0).style('fill', d => getColor(d)).transition("2").delay(500 * interval_time).duration(
            2490 * interval_time)
            .attr(
                "fill-opacity", 1).attr("y", 0)
            .attr("class", function (d) {
                return "label "
            })
            .attr("x", -15)
            .attr("y", 20)
            .attr("text-anchor", "end")
            .text(function (d) {
                if (long) {
                    return ""
                }
                return d.name;
            })
        // bar上文字
        var barInfo = barEnter.append("text").attr("x",
            function (d) {
                if (long) return 10;
                if (enter_from_0) {
                    return 0;
                } else {
                    return xScale(currentData[currentData.length - 1].value);
                }
            })
            .attr("stroke", d => getColor(d))
            .attr("class", function () {
                return "barInfo"
            })
            .attr("y", 50).attr("stroke-width", "0px").attr("fill-opacity",
                0).transition()
            .delay(500 * interval_time).duration(2490 * interval_time).text(
                function (d) {
                    if (use_type_info) {
                        return d[divide_by] + "-" + d.name;
                    }
                    return d.name;
                })
            .attr("x", d => {
                if (long) return 10;
                return xScale(xValue(d)) - 10
            }).attr(
                "fill-opacity",
                function (d) {
                    if (xScale(xValue(d)) - 10 < display_barInfo) {
                        return 0;
                    }
                    return 1;
                })
            .attr("y", 2)
            .attr("dy", ".5em")
            .attr("text-anchor", function () {
                if (long) return 'start';
                return 'end';
            })
            .attr("stroke-width", function (d) {
                if (xScale(xValue(d)) - 10 < display_barInfo) {
                    return "0px";
                }
                return "1px";
            });
        if (long) {
            barInfo.tween(
                "text",
                function (d) {
                    var self = this;

                    var i = d3.interpolate(self.textContent, Number(d.value)),
                        prec = (Number(d.value) + "").split("."),
                        round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
                    return function (t) {
                        self.textContent = d[divide_by] + "-" + d.name + '  数值:' + d3.format(format)(Math.round(i(t) * round) / round);
                    };
                })
        }
        if (!long) {

            barEnter.append("text").attr("x",
                function () {
                    if (long) {
                        return 10;
                    }
                    if (enter_from_0) {
                        return 0;
                    } else {
                        return xScale(currentData[currentData.length - 1].value);
                    }
                }).attr("y", 50).attr("fill-opacity", 0).style('fill', d => getColor(d)).transition()
                .duration(2990 * interval_time).tween(
                "text",
                function (d) {
                    var self = this;
                    var i = d3.interpolate(self.textContent, Number(d.value)),
                        prec = (Number(d.value) + "").split("."),
                        round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
                    return function (t) {
                        self.textContent = d3.format(format)(Math.round(i(t) * round) / round);
                        value = self.textContent
                    };
                }).attr(
                "fill-opacity", 1).attr("y", 0)
                .attr("class", function (d) {
                    return "value"
                }).attr("x", d => {
                return xScale(xValue(d)) + 10
            })
                .attr("y", 22)
        }


        var barUpdate = bar.transition("2").duration(2990 * interval_time).ease(d3.easeLinear);

        barUpdate.select("rect").style('fill', d => getColor(d))
            .attr("width", d => xScale(xValue(d)))

        barUpdate.select(".label").attr("class", function (d) {
            return "label ";
        }).style('fill', d => getColor(d))
            .attr("width", d => xScale(xValue(d)))
        if (!long) {

            barUpdate.select(".value").attr("class", function (d) {
                return "value"
            }).style('fill', d => getColor(d))
                .attr("width", d => xScale(xValue(d)))

        }
        barUpdate.select(".barInfo").attr("stroke", function (d) {
            return getColor(d);
        })

        var barInfo = barUpdate.select(".barInfo")
            .text(
                function (d) {
                    if (use_type_info) {
                        return d[divide_by] + "-" + d.name;
                    }
                    return d.name;
                })
            .attr("x", d => {
                if (long) return 10;
                return xScale(xValue(d)) - 10
            })
            .attr(
                "fill-opacity",
                function (d) {
                    if (xScale(xValue(d)) - 10 < display_barInfo) {
                        return 0;
                    }
                    return 1;
                }
            )


            .attr("stroke-width", function (d) {
                if (xScale(xValue(d)) - 10 < display_barInfo) {
                    return "0px";
                }
                return "1px";
            })

        if (long) {
            barInfo.tween(
                "text",
                function (d) {
                    var self = this;
                    var str = d[divide_by] + "-" + d.name + '  数值:'

                    var i = d3.interpolate(self.textContent.slice(str.length, 99), Number(d.value)),
                        prec = (Number(d.value) + "").split("."),
                        round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
                    return function (t) {
                        self.textContent = d[divide_by] + "-" + d.name + '  数值:' + d3.format(format)(Math.round(i(t) * round) / round);
                    };
                })
        }
        if (!long) {
            barUpdate.select(".value").tween("text", function (d) {
                var self = this;
                var i = d3.interpolate((self.textContent), Number(d.value)),
                    prec = (Number(d.value) + "").split("."),
                    round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;
                return function (t) {
                    self.textContent = d3.format(format)(Math.round(i(t) * round) / round);
                    d.value = self.textContent;
                };
            }).duration(2990 * interval_time).attr("x", d => xScale(xValue(d)) + 10)

        }
        avg = (Number(currentData[0]["value"]) + Number(currentData[currentData.length - 1]["value"])) / 2

        var barExit = bar.exit().attr("fill-opacity", 1).transition().duration(2500 * interval_time)

        barExit.attr("transform", function (d) {
            if (Number(d.value) > avg && allow_up) {

                return "translate(0," + "-100" + ")";
            }
            return "translate(0," + "880" + ")";

        })
            .remove().attr("fill-opacity", 0);
        barExit.select("rect").attr("fill-opacity", 0).attr("width", xScale(currentData[currentData.length - 1]["value"]))
        if (!long) {

            barExit.select(".value").attr("fill-opacity", 0).attr("x", () => {
                return xScale(currentData[currentData.length - 1]["value"]
                )
            })
        }
        barExit.select(".barInfo").attr("fill-opacity", 0).attr("stroke-width", function (d) {
            return "0px";
        }).attr("x", () => {
            if (long) return 10;
            return (xScale(currentData[currentData.length - 1]["value"] - 10)

            )
        })
        barExit.select(".label").attr("fill-opacity", 0)
    }


    function change() {
        dataSort()
        yScale
            .domain(currentData.map(d => d.name).reverse())
            .range([innerHeight, 0]);
        if (animation == 'linear') {
            g.selectAll(".bar")
                .data(currentData, function (d) {
                    return d.name;
                }).transition("1").ease(d3.easeLinear).duration(3000 * update_rate * interval_time).attr("transform", function (d) {
                return "translate(0," + yScale(yValue(d)) + ")";
            })
        } else {
            g.selectAll(".bar")
                .data(currentData, function (d) {
                    return d.name;
                }).transition("1").duration(3000 * update_rate * interval_time).attr("transform", function (d) {
                return "translate(0," + yScale(yValue(d)) + ")";
            })
        }
    }

    var i = 0;
    var p = config.wait;
    var update_rate = config.update_rate
    var inter = setInterval(function next() {

        // 空过p回合
        while (p) {
            p -= 1;
            return;
        }
        currentdate = time[i];
        getCurrentData(time[i]);
        i++;

        if (i >= time.length) {
            window.clearInterval(inter);
        }

    }, 3000 * interval_time);
    var inter2 = setInterval(() => {

        //console.log(currentData);
        d3.transition()
            .each(change)
        if (i >= time.length) {
            window.clearInterval(inter2);
        }
    }, 3000 * update_rate * interval_time)
}
