(function () {
  var API = '/api/method/meshapp.api.smart_dashboard';

  var iconMap = {
    sales: '销',
    execution: '产',
    outbound: '库',
    master: '数',
    report: '报'
  };

  function page() {
    return location.pathname.split('/').pop();
  }

  async function apiCall(name, params) {
    var url = API + '.' + name;
    if (params) {
      var q = new URLSearchParams(params).toString();
      if (q) url += '?' + q;
    }
    var res = await fetch(url, { credentials: 'same-origin' });
    var data = await res.json();
    if (!res.ok || data.exc) {
      throw new Error(data._error_message || data.exc || '请求失败');
    }
    return data.message || {};
  }

  function toggleChartArea(visible) {
    var barWrap = document.getElementById('chart-wrap');
    var lineWrap = document.getElementById('line-chart-wrap');
    if (barWrap) barWrap.style.display = visible ? 'grid' : 'none';
    if (lineWrap) lineWrap.classList.toggle('active', false);
  }

  function renderSubmoduleCards(items) {
    var root = document.getElementById('submodule-grid');
    if (!root) return;
    root.innerHTML = (items || []).map(function (it) {
      var link = it.key === 'execution'
        ? '/assets/meshapp/h5/index.html?v=2026030801'
        : ('./submodule.html?module=' + encodeURIComponent(it.key));

      return (
        '<a class="launcher-item" href="' + link + '">' +
        '<span class="launcher-icon">' + (iconMap[it.key] || '模') + '</span>' +
        '<span class="launcher-name">' + it.title + '</span>' +
        '<span class="launcher-desc">' + (it.desc || '') + '</span>' +
        '</a>'
      );
    }).join('');
  }

  function renderBarChart(chart) {
    var wrap = document.getElementById('chart-wrap');
    if (!wrap) return;
    var max = 0;
    (chart || []).forEach(function (x) {
      max = Math.max(max, Number(x.value || 0));
    });
    max = max || 1;

    wrap.style.display = 'grid';
    wrap.innerHTML = (chart || []).map(function (x) {
      var val = Number(x.value || 0);
      var h = Math.max(Math.round((val / max) * 56), 8);
      return (
        '<div class="bar">' +
        '<div class="bar-fill" style="height:' + h + 'px"></div>' +
        '<div class="bar-label">' + x.label + '</div>' +
        '<div class="bar-value">' + val.toLocaleString() + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function scaleSeries(labels, seriesData) {
    var min = Number.POSITIVE_INFINITY;
    var max = 0;
    seriesData.forEach(function (s) {
      (s.values || []).forEach(function (v) {
        var n = Number(v || 0);
        min = Math.min(min, n);
        max = Math.max(max, n);
      });
    });
    if (!isFinite(min)) min = 0;
    if (max === min) max = min + 1;

    return { min: min, max: max, labels: labels, series: seriesData };
  }

  function pointsFor(values, w, h, min, max) {
    var len = values.length;
    if (!len) return [];
    var step = len > 1 ? (w / (len - 1)) : 0;
    return values.map(function (v, i) {
      var x = i * step;
      var y = h - ((Number(v || 0) - min) / (max - min)) * h;
      return { x: x, y: y, v: Number(v || 0) };
    });
  }

  function renderLineChart(chartSeries) {
    var lineWrap = document.getElementById('line-chart-wrap');
    var barWrap = document.getElementById('chart-wrap');
    if (!lineWrap || !barWrap) return;

    if (!chartSeries || !chartSeries.series || !chartSeries.series.length) {
      lineWrap.classList.remove('active');
      return;
    }

    barWrap.style.display = 'none';
    lineWrap.classList.add('active');

    var labels = chartSeries.labels || [];
    var scaled = scaleSeries(labels, chartSeries.series);
    var w = 620;
    var h = 160;

    var legend = '<div class="line-legend">' + scaled.series.map(function (s) {
      return '<span class="legend-item"><i class="legend-dot" style="background:' + s.color + '"></i>' + s.name + '</span>';
    }).join('') + '</div>';

    var grid = '';
    for (var i = 0; i < 4; i++) {
      var gy = (h / 3) * i;
      grid += '<line class="grid-line" x1="0" y1="' + gy + '" x2="' + w + '" y2="' + gy + '"></line>';
    }

    var lines = '';
    var points = '';

    scaled.series.forEach(function (s) {
      var pts = pointsFor(s.values || [], w, h, scaled.min, scaled.max);
      var poly = pts.map(function (p) { return p.x + ',' + p.y; }).join(' ');
      lines += '<polyline fill="none" stroke="' + s.color + '" stroke-width="3" points="' + poly + '"></polyline>';
      pts.forEach(function (p) {
        points += '<circle class="point" cx="' + p.x + '" cy="' + p.y + '" r="4" fill="' + s.color + '"><title>' + s.name + ': ' + p.v + '</title></circle>';
      });
    });

    var axis = '';
    if (labels.length > 1) {
      var step = w / (labels.length - 1);
      labels.forEach(function (lb, i) {
        axis += '<text class="axis-label" x="' + (i * step) + '" y="178" text-anchor="middle">' + lb + '</text>';
      });
    }

    lineWrap.innerHTML = legend +
      '<svg class="line-svg" viewBox="-10 -6 640 200" preserveAspectRatio="xMidYMid meet">' +
      grid + lines + points + axis +
      '</svg>';
  }

  function renderQuickLinks(links) {
    var root = document.getElementById('quick-links');
    if (!root) return;
    root.innerHTML = (links || []).map(function (x) {
      return (
        '<a class="entry-link" href="' + x.route + '">' +
        '<strong>' + x.title + '</strong>' +
        '<span>' + (x.desc || '') + '</span>' +
        '</a>'
      );
    }).join('');
  }

  async function initIndex() {
    try {
      var data = await apiCall('list_submodules');
      renderSubmoduleCards(data.items || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function initSubmodule() {
    var q = new URLSearchParams(location.search);
    var moduleKey = q.get('module') || 'sales';

    try {
      var data = await apiCall('get_submodule_dashboard', { module_key: moduleKey });
      var title = document.getElementById('module-title');
      var key = document.getElementById('module-key');
      var metric = document.getElementById('metric-title');
      if (title) title.textContent = data.title || '工作台';
      if (key) key.textContent = moduleKey;
      if (metric) metric.textContent = data.metric || '近三月趋势';

      var showChart = data.show_chart !== false;
      if (!showChart) {
        if (metric) metric.textContent = '功能项';
        toggleChartArea(false);
      } else {
        toggleChartArea(true);
      }

      if (showChart && moduleKey === 'sales' && data.chart_series) {
        renderLineChart(data.chart_series);
      } else if (showChart) {
        renderBarChart(data.chart || []);
      }

      renderQuickLinks(data.quick_links || []);
    } catch (e) {
      console.error(e);
    }
  }

  if (page() === 'index.html') initIndex();
  if (page() === 'submodule.html') initSubmodule();
})();
