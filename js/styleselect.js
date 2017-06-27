
// UMD module from From https://github.com/umdjs/umd/blob/master/returnExports.js
// From 'if the module has no dependencies' example.
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
  }
}(this, function () {
// End of UMD module

  
  /**
   * @description Adds multiple (or single) event handlers on a given element.
   * @param {HTMLElement} [el] - Element to listen from.
   * @param {string} evts - Space separated string of event names.
   * @param {Function} fun - Function to use as an event handler.
   */
  var onEvt = function(el, evts, fun) {
    (evts.split(" ")).forEach(function(evt){
      el.addEventListener(evt, fun, false);
    });
  }

	// Quick aliases and polyfills if needed
	var query = document.querySelector.bind(document);
	var queryAll = document.querySelectorAll.bind(document);

	var KEYCODES = {
		SPACE: 32,
		UP: 38,
		DOWN: 40,
		ENTER: 13
	};

	if ( ! NodeList.prototype.forEach ) {
		NodeList.prototype.forEach = Array.prototype.forEach;
	}
	if ( ! HTMLCollection.prototype.forEach ) {
		HTMLCollection.prototype.forEach = Array.prototype.forEach;
	}
	if ( ! Element.prototype.matches ) {
		// See https://developer.mozilla.org/en-US/docs/Web/API/Element.matches
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.oMatchesSelector
	}

	// IE 9-11 CustomEvent polyfill
	// From https://developer.mozilla.org/en/docs/Web/API/CustomEvent
	var CustomEvent = function( eventName, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var event = document.createEvent( 'CustomEvent' );
		event.initCustomEvent( eventName, params.bubbles, params.cancelable, params.detail );
		return event;
	};
	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;

	// IE10 dataset polyfill
	// From https://gist.githubusercontent.com/brettz9/4093766/raw/ba31a05e7ce21af67c6cafee9b3f439c86e95b01/html5-dataset.js
	if (!document.documentElement.dataset &&
			 // FF is empty while IE gives empty object
			(!Object.getOwnPropertyDescriptor(Element.prototype, 'dataset')  ||
			!Object.getOwnPropertyDescriptor(Element.prototype, 'dataset').get)
		) {
		var propDescriptor = {
			enumerable: true,
			get: function () {
				'use strict';
				var i,
					that = this,
					HTML5_DOMStringMap,
					attrVal, attrName, propName,
					attribute,
					attributes = this.attributes,
					attsLength = attributes.length,
					toUpperCase = function (n0) {
						return n0.charAt(1).toUpperCase();
					},
					getter = function () {
						return this;
					},
					setter = function (attrName, value) {
						return (typeof value !== 'undefined') ?
							this.setAttribute(attrName, value) :
							this.removeAttribute(attrName);
					};
				try { // Simulate DOMStringMap w/accessor support
					// Test setting accessor on normal object
					({}).__defineGetter__('test', function () {});
					HTML5_DOMStringMap = {};
				}
				catch (e1) { // Use a DOM object for IE8
					HTML5_DOMStringMap = document.createElement('div');
				}
				for (i = 0; i < attsLength; i++) {
					attribute = attributes[i];
					// Fix: This test really should allow any XML Name without
					//         colons (and non-uppercase for XHTML)
					if (attribute && attribute.name &&
						(/^data-\w[\w\-]*$/).test(attribute.name)) {
						attrVal = attribute.value;
						attrName = attribute.name;
						// Change to CamelCase
						propName = attrName.substr(5).replace(/-./g, toUpperCase);
						try {
							Object.defineProperty(HTML5_DOMStringMap, propName, {
								enumerable: this.enumerable,
								get: getter.bind(attrVal || ''),
								set: setter.bind(that, attrName)
							});
						}
						catch (e2) { // if accessors are not working
							HTML5_DOMStringMap[propName] = attrVal;
						}
					}
				}
				return HTML5_DOMStringMap;
			}
		};
		try {
			// FF enumerates over element's dataset, but not
			//   Element.prototype.dataset; IE9 iterates over both
			Object.defineProperty(Element.prototype, 'dataset', propDescriptor);
		} catch (e) {
			propDescriptor.enumerable = false; // IE8 does not allow setting to true
			Object.defineProperty(Element.prototype, 'dataset', propDescriptor);
		}
	}


  // Cycles through elements in `triggerTargetList` and returns `true` if `target` element matches one of them
  var inTriggerTargetList = function(target, triggerTargetList) {

    if(triggerTargetList && triggerTargetList.length) {
      var inList = false;
      triggerTargetList.forEach(function(el) {
        if(el === target || el.contains(target)) inList = true;
      });

      if(inList) return true;
    }
    return false
  }

	// Return true if any ancestor matches selector
	// Borrowed from ancestorMatches() from agave.js (MIT)
	var isAncestorOf = function(element, selector, includeSelf) {
		var parent = element.parentNode;
		if ( includeSelf && element.matches(selector) ) {
			return true
		}
		// While parents are 'element' type nodes
		// See https://developer.mozilla.org/en-US/docs/DOM/Node.nodeType
		while ( parent && parent.nodeType && parent.nodeType === 1 ) {
			if ( parent.matches(selector) ) {
				return true
			}
			parent = parent.parentNode;
		}
		return false;
	};


	// Used to match select boxes to their style select partners
	var makeUUID = function(){
		return 'ss-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
			return v.toString(16);
		})
	};


	// The 'styleSelect' main function
	// selector:String - CSS selector for the select box to style
  	// allowTouchDevices: boolean - Optionally pass `true` to treat touch devices the same as desktop (and not use native select element UI).
  	// customCloseEvent: string - Optionally provide a custom event to listen to (on the `select` element), that will cause the dropdown to collapse. A space separated string can be used for multiple events.
  	// triggerTargetList: HTMLElement[] - Optionally provide a list of elements to ignore when clicking off the dropdown.
	// textWrap: [object]   - Optionally wraps the dropdown elements in custom HTML. Example: `{ open: "<div>", close:"</div>" }`
	return function(selector, allowTouchDevices, customCloseEvent, triggerTargetList, textWrap) {

		// Use native selects (which pop up large native UIs to go through the options ) on iOS/Android
		if ( !allowTouchDevices && navigator.userAgent.match( /iPad|iPhone|Android/i ) ) {
			return
		}

		var realSelect = query(selector),
			realOptions = realSelect.children,
			selectedIndex = realSelect.selectedIndex,
			uuid = makeUUID(),
			styleSelectHTML = '<div class="style-select" aria-hidden="true" data-ss-uuid="' + uuid + '">';

		if (selectedIndex === -1) realSelect.selectedIndex = selectedIndex = 0;

		// The index of the item that's being highlighted by the mouse or keyboard
		var highlightedOptionIndex;
		var highlightedOptionIndexMax = realOptions.length - 1;

		realSelect.setAttribute('data-ss-uuid', uuid);
		// Even though the element is display: none, a11y users should still see it.
		// According to http://www.w3.org/TR/wai-aria/states_and_properties#aria-hidden
		// some browsers may have bugs with this but future implementation may improve
		realSelect.setAttribute('aria-hidden', "false");

		// Build styled clones of all the real options
		var selectedOptionHTML;
		var optionsHTML = '<div class="ss-dropdown">';
		realOptions.forEach(function(realOption, index){
			var text = realOption.textContent,
				value = realOption.getAttribute('value') || '',
                cssClass = 'ss-option';

            // gathers other attributes
			var len = realOption.attributes.length,
                attr, attrStr = "";
			for(var i=0; i<len; i++) {
			    attr = realOption.attributes[i];

			    if (attr.name !== "value" && attr.name !== "class") {
			        //console.log("attr", attr);
			        attrStr += attr.name + '="' + attr.value + '" ';
			    }
			}

			if (index === selectedIndex) {
				// Mark first item as selected-option - this is where we store state for the styled select box
				// aria-hidden=true so screen readers ignore the styles selext box in favor of the real one (which is visible by default)
				selectedOptionHTML = '<div class="ss-selected-option" tabindex="0" data-value="' + value + '">' + text + '</div>'
			}

            if (realOption.disabled) {
                cssClass += ' disabled';
            }

            // Continue building optionsHTML
            if (textWrap && typeof textWrap === "object") {
                optionsHTML += '<div class="' + cssClass + '" data-value="' + value + '" ' + attrStr + '>' + textWrap.open + text + textWrap.close + '</span></div>';
			} else {
                optionsHTML += '<div class="' + cssClass + '" data-value="' + value + '" ' + attrStr + '>' + text + '</div>';
			}
		});
		optionsHTML += '</div>';
		styleSelectHTML += selectedOptionHTML += optionsHTML += '</div>';
		// And add out styled select just after the real select
		realSelect.insertAdjacentHTML('afterend', styleSelectHTML);

		var styledSelect = query('.style-select[data-ss-uuid="'+uuid+'"]');
		var styleSelectOptions = styledSelect.querySelectorAll('.ss-option');
		var selectedOption = styledSelect.querySelector('.ss-selected-option');

		var changeRealSelectBox = function(newValue, newLabel) {
			// Close styledSelect
			styledSelect.classList.remove('open');

			// Update styled value
			selectedOption.textContent = newLabel;
			selectedOption.dataset.value = newValue;

			// Update the 'tick' that shows the option with the current value
			styleSelectOptions.forEach(function(styleSelectOption){
				if ( styleSelectOption.dataset.value === newValue) {
					styleSelectOption.classList.add('ticked')
				} else {
					styleSelectOption.classList.remove('ticked')
				}
			});

			// Update real select box
			realSelect.value = newValue;

			// Send 'change' event to real select - to trigger any change event listeners
			var changeEvent = new CustomEvent('change');
			realSelect.dispatchEvent(changeEvent);
		};

		// Change real select box when a styled option is clicked
		styleSelectOptions.forEach(function(unused, index){
			var styleSelectOption = styleSelectOptions.item(index);

            if (styleSelectOption.className.match(/\bdisabled\b/)) {
                return;
            }

            styleSelectOption.addEventListener('click', function(ev) {
				var target = ev.target,
					styledSelectBox = target.parentNode.parentNode,
					uuid = styledSelectBox.getAttribute('data-ss-uuid'),
					newValue = target.getAttribute('data-value'),
					newLabel = target.textContent;

				changeRealSelectBox(newValue, newLabel)

			});

			// Tick and highlight the option that's currently in use
            if ( styleSelectOption.dataset.value === realSelect.value ) {
				highlightedOptionIndex = index;
				styleSelectOption.classList.add('ticked');
				styleSelectOption.classList.add('highlighted')
			}

			// Important: we can't use ':hover' as the keyboard and default value can also set the highlight
			styleSelectOption.addEventListener('mouseover', function(ev){
				styleSelectOption.parentNode.childNodes.forEach(function(sibling, index){
					if ( sibling === ev.target ) {
						sibling.classList.add('highlighted');
						highlightedOptionIndex = index;
					} else {
						sibling.classList.remove('highlighted')
					}
				})
			})
		});



		var closeAllStyleSelects = function(exception){
			queryAll('.style-select').forEach(function(styleSelectEl) {
				if ( styleSelectEl !== exception ) {
					styleSelectEl.classList.remove('open');
				}
			});
		};

		var toggleStyledSelect = function(styledSelectBox){
			if ( ! styledSelectBox.classList.contains('open') ) {
				// If we're closed and about to open, close other style selects on the page
				closeAllStyleSelects(styledSelectBox);
			}

			if (realSelect.disabled) return;
			// Then toggle open/close
			styledSelectBox.classList.toggle('open');

		    // un-highlight options when opening
			if (styledSelectBox.classList.contains('open')) {
			    styleSelectOptions.forEach(function (option, index) {
			        option.classList.remove('highlighted');
			    })
			}
		};

		// When a styled select box is clicked
		var styledSelectedOption = query('.style-select[data-ss-uuid="' + uuid + '"] .ss-selected-option');
		styledSelectedOption.addEventListener('click', function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			toggleStyledSelect(ev.target.parentNode);
		});

		// Keyboard handling
		styledSelectedOption.addEventListener('keydown', function(ev) {
			var styledSelectBox = ev.target.parentNode;

			switch (ev.keyCode) {
				case KEYCODES.SPACE:
					// Space shows and hides styles select boxes
					toggleStyledSelect(styledSelectBox);
					break;
				case KEYCODES.DOWN:
				case KEYCODES.UP:
					// Move the highlight up and down
					if ( ! styledSelectBox.classList.contains('open') ) {
						// If style select is not open, up/down should open it.
						toggleStyledSelect(styledSelectBox);
					} else {
						// If style select is already open, these should change what the highlighted option is
						if ( ev.keyCode === KEYCODES.UP ) {
							// Up arrow moves earlier in list
							if ( highlightedOptionIndex !== 0 ) {
								highlightedOptionIndex = highlightedOptionIndex - 1
							}
						} else {
							// Down arrow moves later in list
							if ( highlightedOptionIndex < highlightedOptionIndexMax ) {
								highlightedOptionIndex = highlightedOptionIndex + 1
							}
						}
						styleSelectOptions.forEach(function(option, index){
							if ( index === highlightedOptionIndex ) {
								option.classList.add('highlighted')
							} else {
								option.classList.remove('highlighted')
							}
						})
					}
					ev.preventDefault();
					ev.stopPropagation();
					break;
				// User has picked an item from the keyboard
				case KEYCODES.ENTER:
					var highlightedOption = styledSelectedOption.parentNode.querySelectorAll('.ss-option')[highlightedOptionIndex],
						newValue = highlightedOption.dataset.value,
						newLabel = highlightedOption.textContent;

					changeRealSelectBox(newValue, newLabel);
					ev.preventDefault();
					ev.stopPropagation();
					break;
			}
		});

		/**
     * Clicking outside of the styled select box closes any open styled select boxes.
     * Vertical touch scrolling positions recorded so that scrolling doesn't close the dropdown, but tapping does.
     */
    var events = "click", touchY;
    if(allowTouchDevices) {
      
      events += " touchend";

      onEvt(query('body'), "touchstart", function(ev){
        if(ev.touches && ev.touches.length) {
          touchY = ev.touches[0].clientY;
        }
      });
    }
       
    onEvt(query('body'), events, function(ev) {

      // First cycles through elements in `triggerTargetList` and returns early if matched
      if(inTriggerTargetList(ev.target, triggerTargetList)) return;

			if ( ! isAncestorOf(ev.target, '.style-select', true) ) {

        // if a touch event is used, checks to see if it is different from the `touchstart` coords (ie an attempted scroll has occurred)
        if(ev.changedTouches && ev.changedTouches.length) {
          if(ev.changedTouches[0].clientY !== touchY) {
            touchY = null;
            return;
          }
        }

        closeAllStyleSelects();
        touchY = null;
			}
		});

    if(customCloseEvent) {
      if(typeof customCloseEvent !== "string") {
        console.warn("styleSelect", "Property 'customCloseEvent' must be a string.", customCloseEvent);
        return;
      }

      // add custom event handler for collapsing the dropdown
      onEvt(realSelect, customCloseEvent, closeAllStyleSelects);
    }
	};

// Close UMD module
}));

