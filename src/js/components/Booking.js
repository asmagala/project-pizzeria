import {templates, select, settings} from '../settings.js';
import DatePicker from './DatePicker.js';
import AmountWidget from './AmountWidget.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const params = {
      booking: [
        'abc=xyz',
        'lorem=ipsum',
      ],
      eventsCurrent: [

      ],
      eventsRepeat: [

      ],
    };

    console.log('getData params:', params); 

    const urls = {
      booking:        settings.db.url + '/' + settings.db.booking 
                                      + '?' + params.booking.join('&'),
      eventsCurrent:  settings.db.url + '/' + settings.db.event 
                                      + '?' +    params.eventsCurrent.join('&') ,
      eventsRepeat:   settings.db.url + '/' + settings.db.event 
                                      + '?' +    params.eventsRepeat.join('&') ,
    };

    console.log('getData urls:', urls);

  }

  render(elem) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = elem;

    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hoursPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker =new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hoursPicker = new HourPicker(thisBooking.dom.hoursPicker);
  }
}

export default Booking;