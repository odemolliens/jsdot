/*
 This file is part of the JSDot library
 
 http://code.google.com/p/jsdot/
 
 Copyright (c) 2010 Carlo Vanini
 Copyright (c) 2009 Lucia Blondel, Nicos Giuliani, Carlo Vanini
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

/**
	Construct a JSDot Editor.
	@class JSDot editor.
	@constructor
*/
JSDot.Editor = function(jsdot, view, sel) {
	this.jsdot = jsdot;
	this.view = view;
	this.selection = sel;
	
	var tb = document.createElement('div');
	tb.setAttribute('class', 'ui-widget-header ui-corner-all jsdot-toolbar');
	this.view.container.appendChild(tb);
	this.tbContainer = tb;
	new JSDot.Editor.MainBar(this, tb);
};

JSDot.Editor.prototype = {

	/** Toolbar container.
		Div element containig the toolbar elements.
		@type {DOM Element}
	*/
	tbContainer: null,

	/** Set selected button.
		Change tool icon highlighting to show which button is selected
		inside a given toolbar. If another one was already selected,
		it will be deselected.<br>
		If a function 'onDeselect' is defined on the button being deselected,
		it will be called.
		@param {Object} tb the toolbar
		@param {Object} b the button
	*/
	setSelected: function(tb, b) {
		if (tb.selected) {
			if (tb.selected.onDeselect) tb.selected.onDeselect();
			$(tb.selected).removeClass('jsdot-tb-selected');
		}
		$(b).addClass('jsdot-tb-selected');
		tb.selected = b;
	},
	
	/** The nested bar currently shown */
	activeNested: null,
	
	/** List of registered nested bars. */
	nestedBars: {},

	/** Register a new nested bar. */
	addNestedBar: function(bar) {
		this.nestedBars[bar.name] = bar;
		$(bar.container).addClass('jsdot-tb-nested jsdot-tb-hiddentb');
		this.tbContainer.appendChild(bar.container);
	},
	
	/** Show a registered nested bar. */
	showNestedBar: function(name) {
		this.hideNestedBar();
		if (this.nestedBars[name]) $(this.nestedBars[name].container).removeClass('jsdot-tb-hiddentb');
		this.activeNested = this.nestedBars[name];
	},
	
	/** Hides the currently active nested bar. */
	hideNestedBar: function() {
		if (this.activeNested) $(this.activeNested.container).addClass('jsdot-tb-hiddentb');
		this.activeNested = null;
	},
};

/** @class Main toolbar.
	@creator
	Create the toolbar iside the editor.
	@param {jsdot_Editor} editor
	@param {Object} p parent DOM element where to insert button elements
*/
JSDot.Editor.MainBar = function(editor, p) {
	tb = this; // no need for closure actually, but use as shorthand
	this.editor = editor;
	
	this.dragH = new JSDot.Drag(editor.jsdot, editor.view, editor.selection);
	this.createEdgeH = new JSDot.EdgeViz(editor.jsdot, editor.view);
	this.layoutBar = new JSDot.Editor.LayoutBar(editor);
	editor.addNestedBar(this.layoutBar);
	
	var btnSel = document.createElement('button');
	btnSel.innerHTML = 'Select';
	p.appendChild(btnSel);
	$(btnSel).button({
		text: false,
		icons: { primary: 'jsdot-icon-cursor' }
	})
	.click(function() {
		editor.setSelected(tb, btnSel);
		editor.jsdot.addEventHandler('drag', tb.dragH);
		var s = editor.selection;
		s.allowNodes = true;
		s.allowEdges = true;
		s.allowMultiple = true;
		s.allowDrag = true;
		editor.showNestedBar('layout');
	});
	btnSel.onDeselect = function() {
		editor.jsdot.removeEventHandler('drag');
		editor.hideNestedBar('layout');
	};
	btnSel.click(); // selection tool is enabled on startup
	
	var btnAddN = document.createElement('button');
	btnAddN.innerHTML = 'Add node';
	p.appendChild(btnAddN);
	$(btnAddN).button({
		text: false,
		icons: { primary: 'jsdot-icon-addnode' }
	})
	.click(function() {
		editor.setSelected(tb, btnAddN);
		var s = editor.selection;
		s.allowNodes = false;
		s.allowEdges = false;
		s.allowMultiple = false;
		s.allowDrag = false;
		s.deselectAll();
		editor.jsdot.addEventHandler('create', tb.createNodeH(editor.jsdot));
	});
	btnAddN.onDeselect = function() {
		editor.jsdot.removeEventHandler('create');
	};
	
	var btnAddE = document.createElement('button');
	btnAddE.innerHTML = 'Add node';
	p.appendChild(btnAddE);
	$(btnAddE).button({
		text: false,
		icons: { primary: 'jsdot-icon-addedge' }
	})
	.click(function() {
		editor.setSelected(tb, btnAddE);
		var s = editor.selection;
		s.allowNodes = false;
		s.allowEdges = false;
		s.allowMultiple = false;
		s.allowDrag = false;
		s.deselectAll();
		editor.jsdot.addEventHandler('create', tb.createEdgeH);
	});
	btnAddE.onDeselect = function() {
		editor.jsdot.removeEventHandler('create');
	};
	
	var btnRm = document.createElement('button');
	btnRm.innerHTML = 'Remove node';
	p.appendChild(btnRm);
	$(btnRm).button({
		text: false,
		icons: { primary: 'jsdot-icon-removenode' }
	})
	.click(function() {
		editor.setSelected(tb, btnRm);
		var s = editor.selection;
		s.allowNodes = false;
		s.allowEdges = false;
		s.allowMultiple = false;
		s.allowDrag = false;
		s.deselectAll();
		editor.jsdot.addEventHandler('remove', tb.removeH(editor.jsdot));
	});
	btnRm.onDeselect = function() {
		editor.jsdot.removeEventHandler('remove');
	};
};

JSDot.Editor.MainBar.prototype = {

	/** Selected tool.
		This is used to keep track of which tool icon is highlighted.
		@see jsdot_Editor#setSelected
	*/
	selected: null,
	
	/** Attached editor.
		Editor to which this toolbar is attached.
		@type jsdot_Editor
	*/
	editor: null,
	
	/** Nested bar or layout operations.
		Created in {@link #MainBar}.
		@type JSDot.Editor.LayoutBar
	*/
	layoutBar: null,
	
	/** Handler for drag&drop.
		This is a {@link jsdot_Drag} created in {@link #register}.
	*/
	dragH: null,
	
	/** Construct handler for creating nodes.
		@param {jsdot_Impl} jsdot jsdot instance
		@return {doc_Handler} handler
	*/
	createNodeH: function(jsdot) {
		return {
			click: function(obj, evt) {
				var n = jsdot.graph.createNode();
				n.position = [evt.relX, evt.relY];
				jsdot.fireEvent('created', n);
			}
		};
	},
	
	/** Handler for creating edges.
		This is created in {@link #register}.
		@type JSDot.EdgeViz
	*/
	createEdgeH: null,
	
	/** Construct handler for removing nodes and edges.
		@param {jsdot_Impl} jsdot jsdot instance
		@return {doc_Handler} handler
	*/
	removeH: function(jsdot) {
		return {
			click: function(obj, evt) {
				if (obj && !obj.src) { /* node */
					jsdot.graph.removeNode(obj);
					jsdot.fireEvent('removed', obj);
				} else if (obj && obj.src) { /* edge */
					jsdot.graph.removeEdge(obj);
					jsdot.fireEvent('removed', obj);
				}
			}
		};
	},
	
};

/** @class Layout toolbar.
	@constructor
	@param {jsdot_Editor} editor
	@param {Object} p parent DOM element where to insert button elements
*/
JSDot.Editor.LayoutBar = function(editor) {
	var d = document.createElement('div');
	d.setAttribute('class', 'jsdot-tb-nested');
	
	// mandatory fields for nested bars
	this.name = 'layout';
	this.container = d;
	
	var btnL = document.createElement('button');
	btnL.innerHTML = 'Align left';
	d.appendChild(btnL);
	$(btnL).button({
		text: false,
		icons: { primary: 'jsdot-icon-alignleft' }
	})
	.click(function() {});
};

JSDot.Editor.LayoutBar.prototype = {

};
