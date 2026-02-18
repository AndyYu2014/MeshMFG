import json

import frappe
from frappe.utils import add_days, getdate, nowdate


STATUS_MAP = {
    "Not Started": "not_started",
    "In Process": "in_progress",
    "Stopped": "paused",
    "Completed": "completed",
    "Submitted": "submitted",
}


def _parse_payload(payload):
    raw = payload or frappe.form_dict.get("payload")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        return json.loads(raw)
    return {}


def _as_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _default_company():
    return (
        frappe.defaults.get_user_default("Company")
        or frappe.db.get_single_value("Global Defaults", "default_company")
    )


def _pick_bom(item_code):
    item_default_bom = frappe.db.get_value("Item", item_code, "default_bom")
    if item_default_bom:
        return item_default_bom

    bom = frappe.db.get_value(
        "BOM",
        {
            "item": item_code,
            "is_default": 1,
            "is_active": 1,
            "docstatus": 1,
        },
        "name",
    )
    if bom:
        return bom

    return frappe.db.get_value(
        "BOM",
        {
            "item": item_code,
            "is_active": 1,
            "docstatus": 1,
        },
        "name",
    )


@frappe.whitelist()
def list_work_orders(date_from=None, date_to=None, limit=200):
    date_from = getdate(date_from) if date_from else getdate(nowdate())
    date_to = getdate(date_to) if date_to else add_days(date_from, 6)
    limit = min(max(int(limit or 200), 1), 500)

    filters = [
        ["Work Order", "status", "not in", ["Closed", "Cancelled", "Completed"]],
        ["Work Order", "planned_start_date", ">=", date_from],
        ["Work Order", "planned_start_date", "<=", date_to],
    ]

    rows = frappe.get_all(
        "Work Order",
        filters=filters,
        fields=[
            "name",
            "status",
            "production_item",
            "item_name",
            "qty",
            "bom_no",
            "planned_start_date",
            "company",
        ],
        order_by="planned_start_date asc, modified desc",
        limit_page_length=limit,
    )

    items = []
    for row in rows:
        planned_date = row.get("planned_start_date")
        date_key = str(getdate(planned_date)) if planned_date else str(getdate(nowdate()))
        items.append(
            {
                "name": row.get("name"),
                "status": row.get("status"),
                "status_key": STATUS_MAP.get(row.get("status"), "not_started"),
                "production_item": row.get("production_item"),
                "item_name": row.get("item_name"),
                "qty": _as_float(row.get("qty")),
                "bom_no": row.get("bom_no"),
                "planned_date": date_key,
                "company": row.get("company"),
            }
        )

    return {"items": items, "date_from": str(date_from), "date_to": str(date_to)}


@frappe.whitelist()
def get_item_context(item_code):
    if not item_code:
        frappe.throw("缺少物料编码 item_code")

    item = frappe.db.get_value(
        "Item",
        item_code,
        ["name", "item_name", "stock_uom", "default_bom", "disabled"],
        as_dict=True,
    )
    if not item:
        frappe.throw(f"物料不存在: {item_code}")
    if item.disabled:
        frappe.throw(f"物料已禁用: {item_code}")

    bom_no = item.default_bom or _pick_bom(item_code)

    return {
        "item_code": item.name,
        "item_name": item.item_name,
        "stock_uom": item.stock_uom,
        "bom_no": bom_no,
    }


@frappe.whitelist()
def search_items(query="", limit=20):
    """Search items for dropdown autocomplete."""
    limit = min(int(limit or 20), 50)
    filters = {"disabled": 0}
    or_filters = {}
    if query:
        or_filters = {
            "name": ["like", f"%{query}%"],
            "item_name": ["like", f"%{query}%"],
        }

    rows = frappe.get_all(
        "Item",
        filters=filters,
        or_filters=or_filters if or_filters else None,
        fields=["name", "item_name"],
        order_by="modified desc",
        limit_page_length=limit,
    )

    return {"items": rows}


@frappe.whitelist()
def search_warehouses(query="", limit=20):
    """Search warehouses for dropdown autocomplete."""
    limit = min(int(limit or 20), 50)
    filters = {"disabled": 0, "is_group": 0}
    or_filters = {}
    if query:
        or_filters = {
            "name": ["like", f"%{query}%"],
        }

    company = _default_company()
    if company:
        filters["company"] = company

    rows = frappe.get_all(
        "Warehouse",
        filters=filters,
        or_filters=or_filters if or_filters else None,
        fields=["name"],
        order_by="name asc",
        limit_page_length=limit,
    )

    return {"items": rows}


@frappe.whitelist()
def get_work_order(name=None):
    """Get a single work order for detail page."""
    if not name:
        frappe.throw("缺少工单编号")

    doc = frappe.get_doc("Work Order", name)

    return {
        "name": doc.name,
        "status": doc.status,
        "production_item": doc.production_item,
        "item_name": doc.item_name,
        "qty": _as_float(doc.qty),
        "bom_no": doc.bom_no,
        "source_warehouse": doc.source_warehouse,
        "fg_warehouse": doc.fg_warehouse,
        "wip_warehouse": doc.wip_warehouse,
        "planned_start_date": str(doc.planned_start_date) if doc.planned_start_date else "",
        "company": doc.company,
    }


@frappe.whitelist()
def save_work_order(payload=None):
    data = _parse_payload(payload)

    production_item = data.get("production_item")
    qty = _as_float(data.get("qty"), 0)
    if not production_item:
        frappe.throw("缺少成品物料号")
    if qty <= 0:
        frappe.throw("计划数量必须大于 0")

    bom_no = data.get("bom_no") or _pick_bom(production_item)
    if not bom_no:
        frappe.throw("未找到可用 BOM，请先在系统中维护该物料的 BOM")

    company = data.get("company") or _default_company()
    if not company:
        frappe.throw("未找到默认公司，请检查系统设置")

    # If name is provided, update existing
    existing_name = data.get("name")
    if existing_name and frappe.db.exists("Work Order", existing_name):
        doc = frappe.get_doc("Work Order", existing_name)
        if doc.docstatus != 0:
            frappe.throw("该工单已提交，无法修改")
        doc.production_item = production_item
        doc.qty = qty
        doc.bom_no = bom_no
        doc.company = company
    else:
        doc = frappe.new_doc("Work Order")
        doc.company = company
        doc.production_item = production_item
        doc.qty = qty
        doc.bom_no = bom_no

    if data.get("source_warehouse"):
        doc.source_warehouse = data.get("source_warehouse")
    if data.get("fg_warehouse"):
        doc.fg_warehouse = data.get("fg_warehouse")
    if data.get("wip_warehouse"):
        doc.wip_warehouse = data.get("wip_warehouse")
    if data.get("planned_start_date"):
        doc.planned_start_date = data.get("planned_start_date")

    doc.save()

    return {
        "name": doc.name,
        "status": doc.status,
        "docstatus": doc.docstatus,
        "bom_no": doc.bom_no,
    }


@frappe.whitelist()
def submit_work_order(name=None, payload=None):
    work_order_name = name

    if not work_order_name:
        saved = save_work_order(payload=payload)
        work_order_name = saved.get("name")

    doc = frappe.get_doc("Work Order", work_order_name)
    if doc.docstatus == 0:
        doc.submit()
        doc.reload()

    return {
        "name": doc.name,
        "status": doc.status,
        "docstatus": doc.docstatus,
    }
