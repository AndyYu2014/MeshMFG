import frappe


def has_mobile_app_permission() -> bool:
    """Show the mobile tile only for authenticated users."""
    return frappe.session.user != "Guest"
