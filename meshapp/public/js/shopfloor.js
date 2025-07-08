frappe.ui.form.on('Shopfloor', {
  onload: function(frm) {
    console.log('[Shopfloor] shopfloor.js loaded');

    const layout = document.getElementById('layout-container');
    const equipmentList = document.getElementById('equipment-list');

    if (!layout || !equipmentList) {
      console.warn('layout or equipment-list container not found');
      return;
    }

    // 资产图标支持拖动
    const assets = equipmentList.querySelectorAll('.asset-icon');
    assets.forEach(asset => {
      asset.setAttribute('draggable', true);
      asset.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', e.target.dataset.assetId);
      });
    });

    // 布局容器支持拖放
    layout.addEventListener('dragover', e => e.preventDefault());

    layout.addEventListener('drop', e => {
      e.preventDefault();
      const assetId = e.dataTransfer.getData('text/plain');
      const x = e.offsetX;
      const y = e.offsetY;

      const newIcon = document.createElement('img');
      newIcon.src = '/files/punch.png'; // 你的资产图标路径
      newIcon.style.position = 'absolute';
      newIcon.style.left = `${x}px`;
      newIcon.style.top = `${y}px`;
      newIcon.width = 48;
      newIcon.height = 48;
      newIcon.title = assetId;
      layout.appendChild(newIcon);

      // TODO: 这里可以写保存资产坐标到后台的代码
      console.log(`Dropped asset ${assetId} at (${x}, ${y})`);
    });
  }
});
