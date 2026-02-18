import json

import frappe


WORKSPACE_NAME = "Manufacturing Mobile"
H5_HOME_URL = "/assets/meshapp/h5/index.html"


def _workspace_content() -> str:
    blocks = [
        {"id": "mobile-header", "type": "header", "data": {"text": "制造移动端"}},
        {
            "id": "mobile-link",
            "type": "paragraph",
            "data": {
                "text": (
                    f'<a href="{H5_HOME_URL}" target="_blank" '
                    'rel="noopener noreferrer">打开 Manufacturing Mobile H5</a>'
                )
            },
        },
    ]
    return json.dumps(blocks, ensure_ascii=False)


@frappe.whitelist()
def ensure_mobile_workspace():
    """Create/update a visible workspace entry in left sidebar."""
    if frappe.db.exists("Workspace", WORKSPACE_NAME):
        ws = frappe.get_doc("Workspace", WORKSPACE_NAME)
    else:
        ws = frappe.get_doc(
            {
                "doctype": "Workspace",
                "name": WORKSPACE_NAME,
                "title": WORKSPACE_NAME,
                "label": WORKSPACE_NAME,
                "module": "Manufacturing",
                "public": 1,
                "is_hidden": 0,
                "sequence_id": 90,
                "icon": "mobile",
            }
        )
        ws.insert(ignore_permissions=True)

    ws.public = 1
    ws.is_hidden = 0
    ws.module = "Manufacturing"
    ws.content = _workspace_content()
    ws.save(ignore_permissions=True)
    frappe.db.commit()
    return {"workspace": ws.name, "route": f"/app/{frappe.scrub(ws.name)}", "h5": H5_HOME_URL}
