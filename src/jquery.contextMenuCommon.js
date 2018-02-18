/*
 * jQuery.contextMenuCommon
 * https://anseki.github.io/jquery-contextmenu-common/
 *
 * Copyright (c) 2018 anseki
 * Licensed under the MIT license.
 */

/**
 * @typedef {Object} item
 * @property {string} itemKey - A key of original `items` object. Since jQuery.contextMenu doesn't
 *    check duplicated keys, map it for `value` method.
 * @property {Object|any} options - Each object as item in original `items` object.
 * @property {string} type - 'checkbox' or 'radio'.
 * @property {boolean} checked - Current state of this item. That of `options` is synchronized if it
 *    has that.
 * @property {Array|any} value - Array for checkbox or any for radio.
 * @property {?string} groupId - Only when `type` is 'radio', `groupId` of `group` that includes
 *    this item.
 * @property {string} nodeId - ID of menu node for generating `groupId`.
 * @property {?jQuery} $elm - Element as menu item.
 */

/**
 * @typedef {Object.<itemId: string, item>} items
 */

/**
 * @typedef {Object} group
 * @property {string} checkedItem - `itemId` of current checked item in this group.
 * @property {Array.<string>} items - Array that includes `itemId`s of all items in this group.
 */

/**
 * @typedef {Object.<groupId: string, group>} groups
 */

;(function($) { // eslint-disable-line no-extra-semi
  'use strict';

  // const
  var
    DATA_KEY_CHECKABLE_MAN = '_contextmenu_common_checkable',
    CLASSNAMES_ICON = 'context-menu-icon', // `defaults.classNames.icon` of jQuery.contextMenu
    CLASS_PREFIX = 'contextmenu-common-',
    CLASS_PREFIX_ICON = CLASSNAMES_ICON + '-common-',
    checkableMans = []; // All instances

  /**
   * @param {group} group - Target `group`.
   * @param {items} items - `items` to reference.
   * @param {string} [itemId] - `itemId` of new checked item in this group.
   * @returns {any} `value` of new or current checked item.
   */
  function radioValue(group, items, itemId) {
    var targetItemId = itemId || group.checkedItem, value,
      CLASS_PREFIX_TYPE = CLASS_PREFIX_ICON + 'radio-';
    group.items.forEach(function(itemId) {
      var item = items[itemId], options = item.options, checked;
      if (itemId === targetItemId) {
        checked = true;
        group.checkedItem = itemId;
        value = item.value;
      } else {
        checked = false;
      }
      if (checked !== item.checked) {
        item.checked = options.checked = options.selected = checked;
        if (item.$elm) {
          item.$elm.removeClass(CLASS_PREFIX_TYPE + (checked ? 'off' : 'on'))
            .addClass(CLASS_PREFIX_TYPE + (checked ? 'on' : 'off'));
        }
      }
    });
    return value;
  }

  /**
   * @param {item} item - Target `item`.
   * @param {boolean} [checked] - new `checked` state.
   * @returns {any} value of new or current state as index of `value` array.
   */
  function checkboxValue(item, checked) {
    var CLASS_PREFIX_TYPE = CLASS_PREFIX_ICON + 'checkbox-', options = item.options;
    if (typeof checked === 'boolean' && checked !== item.checked) {
      item.checked = options.checked = options.selected = checked;
      if (item.$elm) {
        item.$elm.removeClass(CLASS_PREFIX_TYPE + (checked ? 'off' : 'on'))
          .addClass(CLASS_PREFIX_TYPE + (checked ? 'on' : 'off'));
      }
    }
    return item.value[item.checked ? 1 : 0];
  }

  /**
   * @class
   * @param {Object} items - This has uncompleted `item`s.
   * @param {jQuery} $trigger - Trigger of the menu.
   * @param {Object} rootOptions - Current root options.
   */
  function CheckableMan(items, $trigger, rootOptions) {
    var that = this, itemKey2itemId = {}, specificGroupIds = {},
      radioItems = [], nodeId2groupId = {}, groups = {};

    // Normalize items
    Object.keys(items).forEach(function(itemId) {
      var item = items[itemId], options = item.options, radiogroup, groupId;

      itemKey2itemId[item.itemKey] = itemId;
      item.checked = options.checked = options.selected = !!options.checked || !!options.selected;

      if (item.type === 'checkbox') {
        item.value = $.isArray(options.value) ? options.value :
          [false, options.hasOwnProperty('value') ? options.value : true];

      } else { // radio
        // Don't make `groupId` and `value` if those are not specified to check after.
        if (((radiogroup = options.radiogroup) != null ||
              (radiogroup = options.radio) != null) &&
            (groupId = radiogroup + '')) {
          item.groupId = groupId;
          specificGroupIds[groupId] = true;
        }
        if (options.hasOwnProperty('value')) {
          item.value = options.value;
        }
        radioItems.push(itemId);
      }
    });

    // Fix `groupId` and `value`
    radioItems.forEach(function(itemId) {
      var item = items[itemId], groupId, idCount, group;
      if (!item.groupId) {
        if (!nodeId2groupId[item.nodeId]) {
          // Get new `groupId`.
          // eslint-disable-next-line curly
          for (groupId = 'node-' + item.nodeId, idCount = 0;
            specificGroupIds[groupId]; groupId = 'node-' + item.nodeId + '-' + (idCount++));
          nodeId2groupId[item.nodeId] = groupId;
        }
        item.groupId = nodeId2groupId[item.nodeId];
      }
      if (!groups[item.groupId]) {
        // Make `checked` of first item be `true` even if `false` is specified.
        radioValue((group = groups[item.groupId] = {items: [itemId]}), items, itemId);
      } else {
        group = groups[item.groupId];
        group.items.push(itemId);
        if (item.checked) { radioValue(group, items, itemId); }
      }
      if (!item.hasOwnProperty('value')) {
        item.value = group.items.length - 1;
      }
    });

    // Setup options
    Object.keys(items).forEach(function(itemId) {
      var item = items[itemId], options = item.options,
        orgCallback = options.callback, orgIcon = options.icon;

      // Wrap callback
      options.callback = function() {
        that.click(itemId);
        return orgCallback ? orgCallback.apply(that.$trigger, arguments) :
          rootOptions.callback ? rootOptions.callback.apply(that.$trigger, arguments) : void 0;
      };

      // Icon
      options.icon = function(o, $elm) {
        item.$elm = $elm;
        if ($.isFunction(orgIcon)) {
          // Overwrite icon, but call it that is function.
          orgIcon.apply(this, arguments);
        }
        return CLASSNAMES_ICON + ' ' +
          CLASS_PREFIX + 'icon-ctrl ' +
          CLASS_PREFIX_ICON + item.type + '-' + (item.checked ? 'on' : 'off');
      };
    });

    that.$trigger = $trigger;
    that.items = items;
    that.groups = groups;
    that.itemKey2itemId = itemKey2itemId;
    that.specificGroupIds = specificGroupIds;
    $trigger.data(DATA_KEY_CHECKABLE_MAN, that);
    checkableMans.push(that);
  }

  CheckableMan.prototype.click = function(itemId) {
    var item = this.items[itemId];
    if (item.type === 'checkbox') {
      checkboxValue(item, !item.checked);
    } else {
      radioValue(this.groups[item.groupId], this.items, itemId);
    }
  };

  CheckableMan.prototype.value = function(itemKeyOrRadioGroup, newValue) {

    /**
     * @param {group} group - Target `group`.
     * @param {items} items - `items` to reference.
     * @param {any} value - `value` for finding.
     * @returns {?string} `itemId` of found item in this group.
     */
    function getItemIdByGroupValue(group, items, value) {
      var targetItemId;
      group.items.some(function(itemId) {
        if (items[itemId].value === value) {
          targetItemId = itemId;
          return true;
        } else {
          return false;
        }
      });
      return targetItemId;
    }

    /**
     * @param {Array} array - Target array.
     * @param {any} value - `value` for finding.
     * @returns {?boolean} `checked` by found index of array.
     */
    function getCheckedByArrayElement(array, value) {
      return array[0] === value ? false : array[1] === value ? true : null;
    }

    var itemId, groupId, item, undef;
    if (itemKeyOrRadioGroup) {
      if (this.specificGroupIds[itemKeyOrRadioGroup]) { // give priority
        groupId = itemKeyOrRadioGroup;
      } else if ((itemId = this.itemKey2itemId[itemKeyOrRadioGroup])) {
        item = this.items[itemId];
        if (item.type === 'radio') { groupId = item.groupId; }
      }
      if (groupId) {
        return radioValue(this.groups[groupId], this.items,
          arguments.length >= 2 ?
            getItemIdByGroupValue(this.groups[groupId], this.items, newValue) : null);
      } else if (itemId) {
        return checkboxValue(item,
          arguments.length >= 2 ? getCheckedByArrayElement(item.value, newValue) : null);
      }
    }
    return undef;
  };

  CheckableMan.prototype.remove = function() {
    var i;
    this.$trigger.removeData(DATA_KEY_CHECKABLE_MAN);
    this.$trigger = this.items = this.groups = this.itemKey2itemId = this.specificGroupIds = null;
    if ((i = checkableMans.indexOf(this)) > -1) {
      checkableMans.splice(i, 1);
    }
  };

  function clearAll() {
    checkableMans.map(function(e) { return e; }) // clone
      .forEach(function(checkableMan) { checkableMan.remove(); });
  }

  /**
   * @param {Object} items - `items` constructor options include.
   * @param {?Object} checkableItems - Reference to an object as target items for recursive calling.
   * @param {{value: number}} nodeId - Current node ID that is wrapped for referencing.
   * @returns {Object} Found out target items. This has uncompleted `item`s.
   */
  function parseItems(items, checkableItems, nodeId) {
    var curNodeId; // nodeId that is not changed by nested nodes.
    if (nodeId == null) {
      nodeId = {value: 0};
    } else {
      nodeId.value++;
    }
    curNodeId = nodeId.value;

    return Object.keys(items).reduce(function(checkableItems, itemKey) {
      /* --*
       * Item object in constructor options.
       * @typedef {Object} item
       * @property {string|jQuery|DOM|Array.<string|jQuery|DOM>} label - (Alias: `name`)
       */

      /* --*
       * Item object in constructor options. item.type === 'checkbox'
       * @typedef {Object} item
       * @property {boolean} checked - (Alias: `selected`) Default: `false`
       * @property {Array|any} value - Default: `[false, true]`
       */

      /* --*
       * Item object in constructor options. item.type === 'radio'
       * @typedef {Object} item
       * @property {string} radiogroup - (Alias: `radio`)
       * @property {boolean} checked - (Alias: `selected`) Default: first item `true`
       * @property {any} value
       */

      var item = items[itemKey], type = item.type, label = item.label || item.name,
        subLabel, isElmLabel, itemId, idCount;

      if (type === 'checkbox' || type === 'radio') {
        delete item.type; // Disable that of jQuery.contextMenu.
        // Make `itemId` unique.
        // eslint-disable-next-line curly
        for (itemId = itemKey, idCount = 0;
          !itemId || checkableItems[itemId]; itemId = itemKey + '' + (idCount++));
        checkableItems[itemId] = {
          itemKey: itemKey,
          options: item,
          type: type,
          nodeId: curNodeId
        };
      }

      if (label && $.isArray(label)) {
        subLabel = label[1];
        label = label[0];
      }
      if (label) {
        if ((isElmLabel = label instanceof jQuery || label.nodeType != null) || // loose check
            subLabel) {
          item.name = isElmLabel ? '' : label;
          item.icon = (function(orgIcon) {

            // Callback to wrap
            return function(o, $elm) {
              if (isElmLabel && !$.contains($elm, label)) {
                $elm.empty().append(label);
              }
              if (subLabel && !$elm.has('.' + CLASS_PREFIX + 'sublabel').length) {
                $elm.prepend(
                  $('<span class="' + CLASS_PREFIX + 'sublabel"/>')[
                    subLabel instanceof jQuery || subLabel.nodeType != null ? // loose check
                    'append' : 'text'](subLabel)
                );
              }

              return !orgIcon ? '' :
                $.isFunction(orgIcon) ? orgIcon.apply(this, arguments) :
                CLASSNAMES_ICON + ' ' + CLASSNAMES_ICON + '-' + orgIcon;
            };

          })(item.icon);
        } else {
          item.name = label;
        }
      }

      if (item.items) { // Nested node
        checkableItems = parseItems(item.items, checkableItems, nodeId);
      }
      return checkableItems;
    }, checkableItems || {});
  }

  /**
   * @param {Object} options - Options for `$.contextMenuCommon`.
   * @param {jQuery} $trigger - Trigger of the menu.
   * @returns {?CheckableMan} A `CheckableMan` instance if target items were found.
   */
  function parseOptions(options, $trigger) {
    var checkableItems;
    return options.items &&
        Object.keys((checkableItems = parseItems(options.items))).length ?
      new CheckableMan(checkableItems, $trigger, options) : null;
  }

  if (!$.contextMenu) {
    throw new Error('jQuery.contextMenu is not loaded.');
  }

  $.contextMenuCommon = function(operation, options) {
    var caughtOptions, caughtOperation, $trigger, checkableMan;
    if (typeof operation === 'string') {
      caughtOperation = operation;
      caughtOptions = options || {};
    } else {
      caughtOperation = 'create';
      caughtOptions = operation || {};
    }

    // Catch operations.
    if (caughtOperation === 'create') {
      if ($.isPlainObject(caughtOptions) &&
          caughtOptions.selector &&
          ($trigger = $(caughtOptions.selector)).length) {
        parseOptions(caughtOptions, $trigger);
      }
    } else if (caughtOperation === 'destroy') {
      // When selector or context was given, don't `clearAll` even if target is not found.
      if (!($trigger =
          typeof caughtOptions === 'string' ? $(caughtOptions) : caughtOptions.context)) {
        clearAll();
      } else if ($trigger.length && (checkableMan = $trigger.data(DATA_KEY_CHECKABLE_MAN))) {
        checkableMan.remove();
      }
    }

    return $.contextMenu.apply($, arguments);
  };

  $.fn.contextMenuCommon = function(method, arg1) {
    var checkableMan = this.length ? this.data(DATA_KEY_CHECKABLE_MAN) : null, itemId;
    if (checkableMan) {
      switch (method) { // eslint-disable-line default-case
        case 'click':
          if ((itemId = checkableMan.itemKey2itemId[arg1])) {
            checkableMan.click(itemId);
          }
          return this;

        case 'value':
          return checkableMan.value.apply(checkableMan, [].slice.call(arguments, 1));

        case 'destroy':
          $.contextMenuCommon('destroy', {context: this});
          return this;

        case 'checkable':
          return checkableMan;
      }
    }
    return $.fn.contextMenu.apply(this, arguments);
  };

})(jQuery);
