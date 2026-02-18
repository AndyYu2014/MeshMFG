(function () {
  var page = location.pathname.split('/').pop();
  var API_BASE = '/api/method/meshapp.api.work_order_h5';

  var statusColor = {
    not_started: 'var(--not-started)',
    in_progress: 'var(--in-progress)',
    paused: 'var(--paused)',
    completed: 'var(--done)',
    submitted: 'var(--done)'
  };

  var statusLabel = {
    not_started: '未开',
    in_progress: '已开',
    paused: '暂停',
    completed: '完成',
    submitted: '已提交'
  };

  function statusKeyByLabel(label) {
    if (!label) return 'not_started';
    var map = {
      'Not Started': 'not_started',
      'In Process': 'in_progress',
      'Stopped': 'paused',
      'Completed': 'completed',
      'Submitted': 'submitted'
    };
    return map[label] || 'not_started';
  }

  async function apiCall(methodName, params, requestMethod) {
    var method = requestMethod || 'GET';
    var url = API_BASE + '.' + methodName;
    var options = {
      method: method,
      credentials: 'same-origin',
      headers: {}
    };

    if (method === 'GET') {
      var q = new URLSearchParams(params || {}).toString();
      if (q) url += '?' + q;
    } else {
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
      options.body = new URLSearchParams(params || {}).toString();
    }

    var res = await fetch(url, options);
    var data = await res.json();
    if (!res.ok || data.exc) {
      var errMsg = '';
      if (data._server_messages) {
        try {
          var msgs = JSON.parse(data._server_messages);
          errMsg = msgs.map(function(m) {
            try { return JSON.parse(m).message || m; } catch(e) { return m; }
          }).join('; ');
        } catch(e) {
          errMsg = data._server_messages;
        }
      }
      if (!errMsg) errMsg = data._error_message || data.exc || '请求失败';
      throw new Error(errMsg.toString());
    }
    return data.message || {};
  }

  function isoDate(dateObj) {
    return dateObj.toISOString().slice(0, 10);
  }

  function addDays(dateObj, days) {
    var d = new Date(dateObj);
    d.setDate(d.getDate() + days);
    return d;
  }

  function countByStatus(list, key) {
    return list.filter(function (x) { return x.status_key === key; }).length;
  }

  /* ===== HOME PAGE (index.html) ===== */
  async function initHomePage() {
    try {
      var today = new Date();
      var result = await apiCall('list_work_orders', {
        date_from: isoDate(addDays(today, -30)),
        date_to: isoDate(addDays(today, 30)),
        limit: 500
      }, 'GET');
      var items = result.items || [];
      var notStarted = items.filter(function(x) { return x.status_key === 'not_started'; }).length;
      var inProgress = items.filter(function(x) { return x.status_key === 'in_progress'; }).length;
      var el1 = document.getElementById('stat-not-started');
      var el2 = document.getElementById('stat-in-progress');
      if (el1) el1.textContent = notStarted;
      if (el2) el2.textContent = inProgress;
    } catch (e) {
      console.error('统计加载失败', e);
    }
  }

  /* ===== WORK ORDERS LIST PAGE ===== */
  function renderWorkOrders(items, dateFrom) {
    var strip = document.getElementById('date-strip');
    var flow = document.getElementById('order-flow');
    if (!strip || !flow) return;

    var groups = {};
    (items || []).forEach(function (item) {
      var day = item.planned_date || isoDate(new Date());
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
    });

    // Build date range: from dateFrom for 14 days
    var allDates = [];
    var base = new Date(dateFrom);
    for (var i = 0; i < 14; i++) {
      allDates.push(isoDate(addDays(base, i)));
    }

    // Ensure all dates in range exist in groups
    allDates.forEach(function(d) {
      if (!groups[d]) groups[d] = [];
    });

    var todayStr = isoDate(new Date());
    var defaultSelected = allDates.indexOf(todayStr) >= 0 ? todayStr : allDates[0];

    var selected = defaultSelected;

    function renderFlow(dateKey) {
      var rows = groups[dateKey] || [];
      if (!rows.length) {
        flow.innerHTML = '<div class="route-empty">当天没有未完工工单</div>';
        return;
      }
      flow.innerHTML = rows.map(function (row) {
        var key = row.status_key || statusKeyByLabel(row.status);
        var lbl = statusLabel[key] || row.status || '-';
        return (
          '<a class="order-card" href="./work-order-new.html?name=' + encodeURIComponent(row.name) + '">' +
          '<span class="status-bar" style="background:' + (statusColor[key] || '#94a3b8') + '"></span>' +
          '<div class="order-main">' +
          '<h3>' + (row.name || '-') + '</h3>' +
          '<p>物料: ' + (row.production_item || '-') + ' | 数量: ' + (row.qty || 0) + '</p>' +
          '</div>' +
          '<div class="order-meta">' + lbl + '</div>' +
          '</a>'
        );
      }).join('');
    }

    strip.innerHTML = allDates.map(function (d) {
      var rows = groups[d] || [];
      var isToday = d === todayStr;
      var dayLabel = d.slice(5);
      if (isToday) dayLabel += ' 今';
      return (
        '<button type="button" class="date-pill ' + (d === selected ? 'active' : '') + '" data-date="' + d + '">' +
        '<div>' + dayLabel + '</div>' +
        '<div class="sub">未开 ' + countByStatus(rows, 'not_started') + ' / 已开 ' + countByStatus(rows, 'in_progress') + '</div>' +
        '</button>'
      );
    }).join('');

    // Scroll to today
    setTimeout(function() {
      var activeBtn = strip.querySelector('.date-pill.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);

    strip.querySelectorAll('.date-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selected = btn.getAttribute('data-date');
        strip.querySelectorAll('.date-pill').forEach(function (x) { x.classList.remove('active'); });
        btn.classList.add('active');
        renderFlow(selected);
      });
    });

    renderFlow(selected);
  }

  async function initWorkOrdersPage() {
    var today = new Date();
    var from = addDays(today, -7);
    var to = addDays(today, 7);
    try {
      var result = await apiCall('list_work_orders', {
        date_from: isoDate(from),
        date_to: isoDate(to),
        limit: 500
      }, 'GET');
      renderWorkOrders(result.items || [], isoDate(from));
    } catch (err) {
      var flow = document.getElementById('order-flow');
      if (flow) {
        flow.innerHTML = '<div class="route-empty">工单加载失败，请刷新重试</div>';
      }
      console.error(err);
    }
  }

  /* ===== NEW / DETAIL WORK ORDER PAGE ===== */
  function bindTabs() {
    var tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        tabs.forEach(function (x) { x.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === key);
        });
      });
    });
  }

  function setMessage(text, isError) {
    var el = document.getElementById('form-message');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = isError ? 'var(--danger)' : 'var(--muted)';
  }

  function getFormPayload() {
    return {
      production_item: document.getElementById('production-item').value.trim(),
      qty: document.getElementById('qty').value,
      source_warehouse: document.getElementById('source-warehouse').value.trim(),
      fg_warehouse: document.getElementById('fg-warehouse').value.trim(),
      wip_warehouse: document.getElementById('wip-warehouse').value.trim(),
      bom_no: document.getElementById('bom-no').value.trim(),
      planned_start_date: document.getElementById('planned-start-date').value
    };
  }

  function setDraftState(text) {
    var chip = document.getElementById('draft-state');
    if (chip) chip.textContent = text;
  }

  /* --- Dropdown/autocomplete helper --- */
  var ddTimers = {};
  function setupDropdown(inputId, listId, fetchFn) {
    var input = document.getElementById(inputId);
    var list = document.getElementById(listId);
    if (!input || !list) return;

    function showList() { list.classList.add('open'); }
    function hideList() { setTimeout(function() { list.classList.remove('open'); }, 200); }

    input.addEventListener('focus', function() {
      doSearch(input.value.trim());
    });

    input.addEventListener('input', function() {
      var q = input.value.trim();
      clearTimeout(ddTimers[inputId]);
      ddTimers[inputId] = setTimeout(function() {
        doSearch(q);
      }, 300);
    });

    input.addEventListener('blur', hideList);

    async function doSearch(query) {
      list.innerHTML = '<div class="dropdown-loading">加载中...</div>';
      showList();
      try {
        var items = await fetchFn(query);
        if (!items.length) {
          list.innerHTML = '<div class="dropdown-loading">无匹配结果</div>';
          return;
        }
        list.innerHTML = items.map(function(item) {
          var val = item.value || item;
          var label = item.label || val;
          return '<div class="dropdown-opt" data-value="' + val + '">' + label + '</div>';
        }).join('');
        list.querySelectorAll('.dropdown-opt').forEach(function(opt) {
          opt.addEventListener('mousedown', function(e) {
            e.preventDefault();
            input.value = opt.getAttribute('data-value');
            list.classList.remove('open');
            input.dispatchEvent(new Event('change'));
          });
        });
      } catch(e) {
        list.innerHTML = '<div class="dropdown-loading">加载失败</div>';
      }
    }
  }

  async function fetchItems(query) {
    var result = await apiCall('search_items', { query: query || '', limit: 20 }, 'GET');
    return (result.items || []).map(function(item) {
      return { value: item.name, label: item.name + (item.item_name ? ' - ' + item.item_name : '') };
    });
  }

  async function fetchWarehouses(query) {
    var result = await apiCall('search_warehouses', { query: query || '', limit: 20 }, 'GET');
    return (result.items || []).map(function(item) {
      return { value: item.name, label: item.name };
    });
  }

  async function loadWorkOrderDetail(name) {
    try {
      var result = await apiCall('get_work_order', { name: name }, 'GET');
      if (!result) return;
      var titleEl = document.getElementById('page-title');
      if (titleEl) titleEl.textContent = '工单详情';
      document.getElementById('production-item').value = result.production_item || '';
      document.getElementById('qty').value = result.qty || '';
      document.getElementById('source-warehouse').value = result.source_warehouse || '';
      document.getElementById('fg-warehouse').value = result.fg_warehouse || '';
      document.getElementById('wip-warehouse').value = result.wip_warehouse || '';
      document.getElementById('bom-no').value = result.bom_no || '';
      if (result.planned_start_date) {
        var dt = result.planned_start_date.replace(' ', 'T');
        document.getElementById('planned-start-date').value = dt.slice(0, 16);
      }
      setDraftState(result.status || '');
    } catch(e) {
      setMessage('加载工单失败：' + e.message, true);
    }
  }

  async function initWorkOrderNewPage() {
    bindTabs();

    // Setup dropdowns
    setupDropdown('production-item', 'dd-production-item', fetchItems);
    setupDropdown('source-warehouse', 'dd-source-warehouse', fetchWarehouses);
    setupDropdown('fg-warehouse', 'dd-fg-warehouse', fetchWarehouses);
    setupDropdown('wip-warehouse', 'dd-wip-warehouse', fetchWarehouses);

    var currentName = '';
    var itemInput = document.getElementById('production-item');
    var saveBtn = document.getElementById('save-work-order');
    var submitBtn = document.getElementById('submit-work-order');

    // Check if we're viewing an existing work order
    var urlParams = new URLSearchParams(location.search);
    var existingName = urlParams.get('name');
    if (existingName) {
      currentName = existingName;
      await loadWorkOrderDetail(existingName);
    }

    // Auto-fill BOM when production item changes
    itemInput.addEventListener('change', async function () {
      var itemCode = itemInput.value.trim();
      if (!itemCode) return;
      try {
        var ctx = await apiCall('get_item_context', { item_code: itemCode }, 'GET');
        if (ctx.bom_no) {
          document.getElementById('bom-no').value = ctx.bom_no;
        }
      } catch (err) {
        setMessage('物料或 BOM 查询失败: ' + err.message, true);
      }
    });

    // Also fire on blur for manual typing
    itemInput.addEventListener('blur', async function () {
      var itemCode = itemInput.value.trim();
      if (!itemCode) return;
      var bomField = document.getElementById('bom-no');
      if (bomField.value.trim()) return; // already filled
      try {
        var ctx = await apiCall('get_item_context', { item_code: itemCode }, 'GET');
        if (ctx.bom_no) {
          bomField.value = ctx.bom_no;
        }
      } catch (err) {
        // silent
      }
    });

    saveBtn.addEventListener('click', async function () {
      saveBtn.disabled = true;
      setMessage('保存中...', false);
      try {
        var payload = getFormPayload();
        if (currentName) {
          payload.name = currentName;
        }
        var result = await apiCall('save_work_order', { payload: JSON.stringify(payload) }, 'POST');
        currentName = result.name;
        setDraftState('已保存');
        setMessage('已保存工单：' + result.name, false);
      } catch (err) {
        setMessage('保存失败：' + err.message, true);
      } finally {
        saveBtn.disabled = false;
      }
    });

    submitBtn.addEventListener('click', async function () {
      submitBtn.disabled = true;
      setMessage('提交中...', false);
      try {
        var params;
        if (currentName) {
          params = { name: currentName };
        } else {
          params = { payload: JSON.stringify(getFormPayload()) };
        }

        var result = await apiCall('submit_work_order', params, 'POST');
        currentName = result.name;
        setDraftState('已提交');
        setMessage('提交成功：' + result.name, false);
      } catch (err) {
        setMessage('提交失败：' + err.message, true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ===== INIT ===== */
  if (page === 'index.html' || page === '' || page === 'h5') {
    initHomePage();
  }
  if (page === 'work-orders.html') {
    initWorkOrdersPage();
  }
  if (page === 'work-order-new.html') {
    initWorkOrderNewPage();
  }
})();
