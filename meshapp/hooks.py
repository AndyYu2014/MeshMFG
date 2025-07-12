app_name = "meshapp"
app_title = "meshapp"
app_publisher = "HornBill"
app_description = "Used for material mesh manufacturing"
app_email = "yuweiade@gmail.com"
app_license = "mit"

app_include_modules = ["erpnext_wxwork"]

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
 add_to_apps_screen = [
 	{
 		"name": "meshapp",
 		"logo": "/assets/meshapp/logo.png",
 		"title": "Meshapp",
 		"route": "/meshapp",
 		"has_permission": "meshapp.api.permission.has_app_permission"
 	}
 ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/meshapp/css/meshapp.css"
# app_include_js = "/assets/meshapp/js/meshapp.js"

# include js, css files in header of web template
# web_include_css = "/assets/meshapp/css/meshapp.css"
# web_include_js = "/assets/meshapp/js/meshapp.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "meshapp/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}
doctype_js = {"Shopfloor Settings" : "meshapp/public/js/shopfloor_settings2.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "meshapp/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]
fixtures = [
    {"doctype": "Workspace", "filters": [["name", "=", "FacilityManagement"]], "filters_name": "workspace_facilitymanagement"},
    {"doctype": "Custom Field", "filters": [["dt", "=", "Item"]], "filters_name": "item_custom_field"},
    {"doctype": "Property Setter", "filters": [["doc_type", "=", "Item"]], "filters_name": "item_property_setter"},
    {"doctype": "Client Script", "filters": [["dt", "=", "Item"]], "filters_name": "item_client_script"},

    {"doctype": "DocType", "filters": [["name", "like", "Facility%"]], "filters_name": "facilitysettings_adoctype"},
    {"doctype": "Client Script", "filters": [["dt", "=", "Facility Settings"]], "filters_name": "facilitysettings_client_script"},

    {"doctype": "DocType", "filters": [["name", "=", "Shopfloor Settings"]], "filters_name": "shopfloorsettings_adoctype"},
    {"doctype": "Custom Field", "filters": [["dt", "=", "Shopfloor Settings"]], "filters_name": "shopfloorsettings_custom_field"},

    {"doctype": "DocType", "filters": [["name", "like", "Shopfloor Asset Position"]], "filters_name": "shopfloorassetposition_adoctype"},

    {"doctype": "Item Group", "filters_name": "mdm_item_group"},
    {"doctype": "Translation", "filters_name": "mdm_translation"}
]
# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "meshapp.utils.jinja_methods",
# 	"filters": "meshapp.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "meshapp.install.before_install"
# after_install = "meshapp.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "meshapp.uninstall.before_uninstall"
# after_uninstall = "meshapp.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "meshapp.utils.before_app_install"
# after_app_install = "meshapp.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "meshapp.utils.before_app_uninstall"
# after_app_uninstall = "meshapp.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "meshapp.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"meshapp.tasks.all"
# 	],
# 	"daily": [
# 		"meshapp.tasks.daily"
# 	],
# 	"hourly": [
# 		"meshapp.tasks.hourly"
# 	],
# 	"weekly": [
# 		"meshapp.tasks.weekly"
# 	],
# 	"monthly": [
# 		"meshapp.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "meshapp.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "meshapp.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "meshapp.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["meshapp.utils.before_request"]
# after_request = ["meshapp.utils.after_request"]

# Job Events
# ----------
# before_job = ["meshapp.utils.before_job"]
# after_job = ["meshapp.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"meshapp.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

