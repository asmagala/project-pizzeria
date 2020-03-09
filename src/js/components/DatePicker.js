/* global flatpickr */

import BaseWidget from './BaseWidget.js';
import {utils} from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }

  initPlugin() {
    const thisWidget = this;

    
    thisWidget.minDate = new Date(thisWidget.value);
    /* Set maxDate that is maxDaysInFuture days later than minDate */
    thisWidget.maxDate = new Date(utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture));
    /* Initialize flatpickr with options */
    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      disable: [
        function(date) {
          return (date.getDay() === 1 );
        }
      ],
      onChange: function(dateStr) {
        thisWidget.value = dateStr;
      },
      locale: {
        firstDayOfWeek: 1,
      }
    });
    /////////////////////////////////////////////////////////////////////////////
    thisWidget.dom.input.addEventListener('input', function() {
      thisWidget.value = thisWidget.dom.input.value;
    });
    ////////////////////////////////////////////////////////////////////////////
  }

  parseValue(properDate) {
    return properDate;
  }

  isValid() {
    return true;
  }

  renderValue() {
    /* empty function to overwrite base function */
  }
}

export default DatePicker;