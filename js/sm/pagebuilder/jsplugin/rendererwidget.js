/**------------------------------------------------------------------------
 * SM Page Builder - Version 1.0.0
 * Copyright (c) 2015 YouTech Company. All Rights Reserved.
 * @license - Copyrighted Commercial Software
 * Author: YouTech Company
 * Websites: http://www.magentech.com
 -------------------------------------------------------------------------*/
"use strict;"
var _Pdm_Widget = function () {
	this.builder = null;
	this.callback = {};
	this.currentCol = null;
	this.currentWidget = null;
	this.currentShortcode = '';
};

var turnoffTinyMCEs = [];
var getContentTinyMCEs = [];
var getTinyMCEFields = [];
var PdmWidget = null;
var PdmCallBack = {};
var PdmCurrentCol = null;
var PdmCurrentWidget = null;
var PdmCurrentShortcode = "";


var _PdmWidgetTools = {
	getDivHtml: function(id, html) {
		if (!html) html = '';
		return '<div id="' + id + '">' + html + '</div>';
	},

	onAjaxSuccess: function(transport) {
		if (transport.responseText.isJSON()) {
			var response = transport.responseText.evalJSON();
			if (response.error) {
				throw response;
			} else if (response.ajaxExpired && response.ajaxRedirect) {
				setLocation(response.ajaxRedirect);
			}
		}
	},

	/*getMaxZIndex: function() {
		var max = 0, i;
		var cn = document.body.childNodes;
		for (i = 0; i < cn.length; i++) {
			var el = cn[i];
			var zIndex = el.nodeType == 1 ? parseInt(el.style.zIndex, 10) || 0 : 0;
			if (zIndex < 10000) {
				max = Math.max(max, zIndex);
			}
		}
		return max + 10;
	},*/

	rot13init: function () {
		var map = new Array();
		var s = 'abcdefghijklmnopqrstuvwxyz';
		for (i=0; i<s.length; i++)
			map[s.charAt(i)] = s.charAt((i+13)%26);
		for (i=0; i<s.length; i++)
			map[s.charAt(i).toUpperCase()] = s.charAt((i+13)%26).toUpperCase();

		return map;
	},

	rot13: function (a) {
		var rot13map;
		if (!rot13map)
			rot13map = this.rot13init();
		s = "";
		for (i=0; i<a.length; i++)
		{
			var b = a.charAt(i);

			s    += (b>='A' && b<='Z' || b>='a' && b<='z' ? rot13map[b] : b);
		}
		return s;
	},

	convertrot13: function (a) {
		var rot13map;
		if (!rot13map)
			rot13map = this.rot13init();
		s = "";
		for (i=0; i<a.length; i++)
		{
			var b = a.charAt(i);

			s    += (b>='A' && b<='Z' || b>='a' && b<='z' ? rot13map[b] : b);
		}
		return s;
	},

	redirectToProduct: function () {
		var encryptedUrl = jQuery('#configure-and-buy-button').attr('data-href');
		if (encryptedUrl) {
			window.open(this.rot13(encryptedUrl), '_blank');
		} else {
			location.window.reload();
		}
	},

	openDialog: function(widgetUrl, objbuilder, callback, col) {
		var objbuilder 	= (objbuilder != null ? objbuilder : null);
		var callback	= (callback != null ? callback : null);
		var col			= (col != null ? col : null);
		if ($('widget_window') && typeof(Windows) != 'undefined') {
			Windows.focus('widget_window');
			return;
		}

		PdmWidget = new _Pdm_Widget();
		PdmWidget.currentShortcode = "";
		PdmWidget.currentWidget = null;
		PdmWidget.builder = objbuilder;
		PdmWidget.callback['widget'] = callback;
		PdmWidget.currentCol = col;

		this.dialogWindow = Dialog.info(null, {
			draggable:true,
			resizable:false,
			closable:true,
			className:'magento',
			windowClassName:"popup-window",
			title:Translator.translate('Page Builder Insert Widget...'),
			top:50,
			width:950,
			//height:450,
			zIndex:1000,
			recenterAuto:false,
			hideEffect:Element.hide,
			showEffect:Element.show,
			id:'widget_window',
			onClose: this.closeDialog.bind(this)
		});
		new Ajax.Updater('modal_dialog_message', widgetUrl, {evalScripts: true});
	},
	closeDialog: function(window) {
		if (turnoffTinyMCEs.length > 0) {
			for (i = 0; i < turnoffTinyMCEs.length; i++) {
				if (typeof turnoffTinyMCEs[i] == "function") {
					turnoffTinyMCEs[i]();
				}
			}
			getContentTinyMCEs = [];
			getTinyMCEFields = [];
		}
		if (!window) {
			window = this.dialogWindow;
		}
		if (window) {
			// IE fix - hidden form select fields after closing dialog
			WindowUtilities._showSelect();
			window.close();
		}
	}
};

var _PdmWysiwygWidget = {};
_PdmWysiwygWidget.Widget = Class.create();
_PdmWysiwygWidget.Widget.prototype = {

	initialize: function(formEl, widgetEl, widgetOptionsEl, optionsSourceUrl, widgetTargetId) {
		$(formEl).insert({bottom: _PdmWidgetTools.getDivHtml(widgetOptionsEl)});
		this.formEl = formEl;
		this.widgetEl = $(widgetEl);
		this.widgetOptionsEl = $(widgetOptionsEl);
		this.optionsUrl = optionsSourceUrl;
		this.optionValues = new Hash({});
		this.widgetTargetId = widgetTargetId;

		this.buildWidgetForm(widgetEl);
		if (typeof(tinyMCE) != "undefined" && tinyMCE.activeEditor) {
			this.bMark = tinyMCE.activeEditor.selection.getBookmark();
		}

		if (typeof(jQuery) != "undefined") {
			jQuery(this.widgetEl).on("change", this.loadOptions.bind(this));
		} else {
			Event.observe(this.widgetEl, "change", this.loadOptions.bind(this));
		}

		console.log('init');
		this.initOptionValue();
	},

	buildWidgetForm: function(widgetEl) {
		this.widgetsAction(widgetEl);
	},

	widgetsAction : function(widgetEl ){
		if(typeof(jQuery) == "undefined")
			return;

		var $wwidgets = jQuery("#basewidget_fieldset");
		var $obj = this;
		jQuery(".form-list", $wwidgets).hide();
		jQuery(".pdm-wg-button > div", $wwidgets).click(function(){
			var widget_type = jQuery(this).data("widgettype");
			var options = $$('select#'+widgetEl+' option');
			var len = options.length;
			$obj.widgetEl.value = widget_type;
			for (var i = 0; i < len; i++) {
				if(options[i].value == widget_type) {
					options[i].selected = true;
				}
			}
			jQuery('select#'+widgetEl).trigger("change");
		});
	},

	getOptionsContainerId: function() {
		return this.widgetOptionsEl.id + '_' + this.widgetEl.value.gsub(/\//, '_');
	},

	switchOptionsContainer: function(containerId) {
		$$('#' + this.widgetOptionsEl.id + ' div[id^=' + this.widgetOptionsEl.id + ']').each(function(e) {
			this.disableOptionsContainer(e.id);
		}.bind(this));
		if(containerId != undefined) {
			this.enableOptionsContainer(containerId);
		}
		this._showWidgetDescription();
	},

	enableOptionsContainer: function(containerId) {
		$$('#' + containerId + ' .widget-option').each(function(e) {
			e.removeClassName('skip-submit');
			if (e.hasClassName('obligatory')) {
				e.removeClassName('obligatory');
				e.addClassName('required-entry');
			}
		});
		$(containerId).removeClassName('no-display');
	},

	disableOptionsContainer: function(containerId) {
		if ($(containerId).hasClassName('no-display')) {
			return;
		}
		$$('#' + containerId + ' .widget-option').each(function(e) {
			// Avoid submitting fields of unactive container
			if (!e.hasClassName('skip-submit')) {
				e.addClassName('skip-submit');
			}
			// Form validation workaround for unactive container
			if (e.hasClassName('required-entry')) {
				e.removeClassName('required-entry');
				e.addClassName('obligatory');
			}
		});
		$(containerId).addClassName('no-display');
	},

	// Assign widget options values when existing widget selected in WYSIWYG
	initOptionValues: function() {
		if (!this.wysiwygExists()) {
			return false;
		}
		var e = this.getWysiwygNode();
		if (e != undefined && e.id) {
			var widgetCode = Base64.idDecode(e.id);
			if (widgetCode.indexOf('{{widget') != -1) {
				this.optionValues = new Hash({});
				widgetCode.gsub(/([a-z0-9\_]+)\s*\=\s*[\"]{1}([^\"]+)[\"]{1}/i, function(match){
					if (match[1] == 'type') {
						this.widgetEl.value = match[2];
					} else {
						this.optionValues.set(match[1], match[2]);
					}
				}.bind(this));

				this.loadOptions();
			}
		}
	},

	// Assign widget options values when existing widget selected in WYSIWYG
	initOptionValue: function(widgetCode) {
		var widgetCode = (PdmWidget.currentShortcode != null ? PdmWidget.currentShortcode : "");
		if (widgetCode.indexOf('{{widget') != -1) {
			this.optionValues = new Hash({});
			widgetCode.gsub(/([a-z0-9\_]+)\s*\=\s*[\"]{1}([^\"]+)[\"]{1}/i, function(match){
				if (match[1] == 'type') {
					this.widgetEl.value = match[2];
				} else {
					this.optionValues.set(match[1], match[2]);
				}
			}.bind(this));

			this.loadOptions();
		} else {
			jQuery("#widget_options_form > .entry-edit-head").show();
			jQuery("#basewidget_fieldset").show();
		}
	},

	loadOptions: function() {
		if (!this.widgetEl.value) {
			this.switchOptionsContainer();
			return;
		}

		var optionsContainerId = this.getOptionsContainerId();
		if ($(optionsContainerId) != undefined) {
			this.switchOptionsContainer(optionsContainerId);
			return;
		}

		this._showWidgetDescription();

		var params = {widget_type: this.widgetEl.value, values: this.optionValues};
		new Ajax.Request(this.optionsUrl,
			{
				parameters: {widget: Object.toJSON(params)},
				onSuccess: function(transport) {
					try {
						_PdmWidgetTools.onAjaxSuccess(transport);
						this.switchOptionsContainer();
						if ($(optionsContainerId) == undefined) {
							this.widgetOptionsEl.insert({bottom: _PdmWidgetTools.getDivHtml(optionsContainerId, transport.responseText)});

							if(typeof(jQuery) != "undefined") {
								jQuery("#widget_options_form > .entry-edit-head").hide();
								jQuery("#basewidget_fieldset").hide();
							}
						} else {
							this.switchOptionsContainer(optionsContainerId);
						}
					} catch(e) {
						alert(e.message);
					}
				}.bind(this)
			}
		);
	},

	_showWidgetDescription: function() {
		var noteCnt = this.widgetEl.next().down('small');
		var descrCnt = $('widget-description-' + this.widgetEl.selectedIndex);
		if(noteCnt != undefined) {
			var description = (descrCnt != undefined ? descrCnt.innerHTML : '');
			noteCnt.update(descrCnt.innerHTML);
		}
	},

	insertWidget: function() {
		widgetOptionsForm = new varienForm(this.formEl);
		if(widgetOptionsForm.validator && widgetOptionsForm.validator.validate() || !widgetOptionsForm.validator){
			var formElements = [];
			var i = 0;
			Form.getElements($(this.formEl)).each(function(e) {
				if(!e.hasClassName('skip-submit')) {
					formElements[i] = e;
					i++;
				}
			});

			// Add as_is flag to parameters if wysiwyg editor doesn't exist
			// var params = Form.serializeElements(formElements);
			var params = Form.serializeElements(formElements, {hash:true,submit:false});
			if (typeof tinyMCE != "undefined" && getContentTinyMCEs.length > 0) {
				var field_name = "";
				for (i = 0; i < getContentTinyMCEs.length; i++) {
					if (typeof getContentTinyMCEs[i] == "function" && typeof getTinyMCEFields[i] == "function") {
						field_name = getTinyMCEFields[i];
						params[field_name] = getContentTinyMCEs[i]();
					}
				}
				getContentTinyMCEs = [];
				getTinyMCEFields = [];
			}
			// if (!this.wysiwygExists()) {
			// 	params = params + '&as_is=1';
			// }
			params['as_is'] = 1;

			new Ajax.Request($(this.formEl).action, {
				parameters: params,
				onComplete: function(transport) {
					try {
						_PdmWidgetTools.onAjaxSuccess(transport);
						Windows.close("widget_window");

						if (typeof(tinyMCE) != "undefined" && tinyMCE.activeEditor) {
							tinyMCE.activeEditor.focus();
							if (this.bMark) {
								tinyMCE.activeEditor.selection.moveToBookmark(this.bMark);
							}
						}

						this.updateContent(transport.responseText);
					} catch(e) {
						console.log(e);
						alert(e.message);
					}
				}.bind(this)
			});
		}
	},

	updateContent: function(content) {
		console.log(typeof (PdmWidget.callback['widget']));
		console.log(typeof (PdmWidget.callback['widget']) != "undefined" && typeof (PdmWidget.callback['widget']) == "function");
		if (typeof (PdmWidget.callback['widget']) != "undefined" && typeof (PdmWidget.callback['widget']) == "function") {
			PdmWidget.callback['widget'].call(PdmWidget.builder, PdmWidget.currentCol, PdmWidget.currentWidget, content);
		} else if (this.wysiwygExists()) {
			this.getWysiwyg().execCommand("mceInsertContent", false, content);
		} else {
			var textarea = document.getElementById(this.widgetTargetId);
			updateElementAtCursor(textarea, content);
			varienGlobalEvents.fireEvent('tinymceChange');
		}
	},

	wysiwygExists: function() {
		return (typeof tinyMCE != 'undefined') && tinyMCE.get(this.widgetTargetId);
	},

	getWysiwyg: function() {
		return tinyMCE.activeEditor;
	},

	getWysiwygNode: function() {
		return tinyMCE.activeEditor.selection.getNode();
	}
};

_PdmWysiwygWidget.chooser = Class.create();
_PdmWysiwygWidget.chooser.prototype = {

	// HTML element A, on which click event fired when choose a selection
	chooserId: null,

	// Source URL for Ajax requests
	chooserUrl: null,

	// Chooser config
	config: null,

	// Chooser dialog window
	dialogWindow: null,

	// Chooser content for dialog window
	dialogContent: null,

	overlayShowEffectOptions: null,
	overlayHideEffectOptions: null,

	initialize: function(chooserId, chooserUrl, config) {
		this.chooserId = chooserId;
		this.chooserUrl = chooserUrl;
		this.config = config;
	},

	getResponseContainerId: function() {
		return 'responseCnt' + this.chooserId;
	},

	getChooserControl: function() {
		return $(this.chooserId + 'control');
	},

	getElement: function() {
		return $(this.chooserId + 'value');
	},

	getElementLabel: function() {
		return $(this.chooserId + 'label');
	},

	open: function() {
		$(this.getResponseContainerId()).show();
	},

	close: function() {
		$(this.getResponseContainerId()).hide();
		this.closeDialogWindow();
	},

	choose: function(event) {
		// Open dialog window with previously loaded dialog content
		if (this.dialogContent) {
			this.openDialogWindow(this.dialogContent);
			return;
		}
		// Show or hide chooser content if it was already loaded
		var responseContainerId = this.getResponseContainerId();

		// Otherwise load content from server
		new Ajax.Request(this.chooserUrl,
			{
				parameters: {element_value: this.getElementValue(), element_label: this.getElementLabelText()},
				onSuccess: function(transport) {
					try {
						_PdmWidgetTools.onAjaxSuccess(transport);
						this.dialogContent = _PdmWidgetTools.getDivHtml(responseContainerId, transport.responseText);
						this.openDialogWindow(this.dialogContent);
					} catch(e) {
						alert(e.message);
					}
				}.bind(this)
			}
		);
	},

	openDialogWindow: function(content) {
		this.overlayShowEffectOptions = Windows.overlayShowEffectOptions;
		this.overlayHideEffectOptions = Windows.overlayHideEffectOptions;
		Windows.overlayShowEffectOptions = {duration:0};
		Windows.overlayHideEffectOptions = {duration:0};
		this.dialogWindow = Dialog.info(content, {
			draggable:true,
			resizable:true,
			closable:true,
			className:"magento",
			windowClassName:"popup-window",
			title:this.config.buttons.open,
			top:50,
			width:950,
			height:500,
			zIndex:1000,
			recenterAuto:false,
			hideEffect:Element.hide,
			showEffect:Element.show,
			id:"widget-chooser",
			onClose: this.closeDialogWindow.bind(this)
		});
		content.evalScripts.bind(content).defer();
	},

	closeDialogWindow: function(dialogWindow) {
		if (turnoffTinyMCEs.length > 0) {
			for (i = 0; i < turnoffTinyMCEs.length; i++) {
				if (typeof turnoffTinyMCEs[i] == "function") {
					turnoffTinyMCEs[i]();
				}
			}
			getContentTinyMCEs = [];
			getTinyMCEFields = [];
		}
		if (!dialogWindow) {
			dialogWindow = this.dialogWindow;
		}
		if (dialogWindow) {
			dialogWindow.close();
			Windows.overlayShowEffectOptions = this.overlayShowEffectOptions;
			Windows.overlayHideEffectOptions = this.overlayHideEffectOptions;
		}
		this.dialogWindow = null;
	},

	getElementValue: function(value) {
		return this.getElement().value;
	},

	getElementLabelText: function(value) {
		return this.getElementLabel().innerHTML;
	},

	setElementValue: function(value) {
		this.getElement().value = value;
	},

	setElementLabel: function(value) {
		this.getElementLabel().innerHTML = value;
	}
};

/*get widget type from shortcode*/
function getWidgetTypeByShortcode(short_code) {
	var widgetType = "";
	if (short_code.indexOf('{{widget') != -1) {
		short_code.gsub(/([a-z0-9\_]+)\s*\=\s*[\"]{1}([^\"]+)[\"]{1}/i, function(match){
			if (match[1] == 'type') {
				widgetType = match[2];
			}
		});
	}
	return widgetType;
}