frappe.ui.form.on('ShopfloorSettings', {
  onload: function(frm) {
    console.log("ShopfloorSettings JS loaded");

    // 直接插入图片HTML
    const image_path = '/files/Shopfloor.png';  // 确保文件已上传至该路径
    frm.fields_dict.layout_image_html.$wrapper.html(`
      <div id="layout-container" style="position:relative; border: 1px solid #ccc;">
        <img src="${image_path}" style="width:100%; max-height:600px; object-fit:contain;" />
        <div id="equipment-list" style="position:absolute; top:0; left:0;"></div>
      </div>
    `);


    const layout = document.getElementById('layout-container');
    const equipmentList = document.getElementById('equipment-list');

    // 设置资产图标为可拖动
    equipmentList.querySelectorAll('.asset-icon').forEach(asset => {
      asset.setAttribute('draggable', true);
      asset.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', asset.dataset.assetId);
      });
    });

    // 拖放容器
    layout.addEventListener('dragover', e => e.preventDefault());

    layout.addEventListener('drop', function (e) {
      e.preventDefault();
      const assetId = e.dataTransfer.getData('text/plain');
      const x = e.offsetX;
      const y = e.offsetY;

      // 页面上添加图标
      const newIcon = document.createElement('img');
      newIcon.src = '/files/Punch.png'; // 可替换为动态图标
      newIcon.style.position = 'absolute';
      newIcon.style.left = `${x}px`;
      newIcon.style.top = `${y}px`;
      newIcon.width = 48;
      newIcon.height = 48;
      layout.appendChild(newIcon);

      // 添加到子表中
      const child = frm.add_child("asset_positions", {
        asset: assetId,
        pos_x: x,
        pos_y: y,
        icon: "/files/Punch.png"
      });
      frm.refresh_field("asset_positions");

      frappe.show_alert(`已添加 ${assetId} 坐标 (${x}, ${y})`);
    });
  }
});
