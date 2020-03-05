import {templates, select, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import DatePicker from './DatePicker.js';
import AmountWidget from './AmountWidget.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.activeTable = '';
        
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        startDateParam,
      ],
    };

    const urls = {
      booking:        settings.db.url + '/' + settings.db.booking 
                                      + '?' + params.booking.join('&'),
      eventsCurrent:  settings.db.url + '/' + settings.db.event 
                                      + '?' +    params.eventsCurrent.join('&') ,
      eventsRepeat:   settings.db.url + '/' + settings.db.event 
                                      + '?' +    params.eventsRepeat.join('&') ,
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings,eventsCurrent, eventsRepeat ]) {
        console.log('bookings', bookings);
        console.log('eventsCurrent', eventsCurrent);
        console.log('eventsRepeat', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    
    thisBooking.booked = {};

    for(let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsRepeat) {
      if(item.repeat == 'daily') {
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1))
        {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    

    let allAvailable = false;

    if( typeof thisBooking.booked[thisBooking.date] == 'undefined' 
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if( !allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    const startHour = utils.hourToNumber(hour);

    if(typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
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
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.formSubmit = thisBooking.dom.wrapper.querySelector(select.booking.formSubmit);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    console.log('thisBooking.dom.form',  thisBooking.dom.form);
    console.log('thisBooking.dom.formSubmit.innerHTML', thisBooking.dom.formSubmit.innerHTML);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    /* Listen for clicks on tables and sets booking class to clicked tables
    set activeTable variable to number of clicked table. Attention! Value of activeTable - string */
    for(let table of thisBooking.dom.tables) {
      table.addEventListener('click', function() {
        
        thisBooking._removeActiveClassFromTables();

        if (!table.classList.contains(classNames.booking.tableBooked)) {
          table.classList.add(classNames.booking.tableInBooking);
          thisBooking.activeTable = table.getAttribute(settings.booking.tableIdAttribute);
        }
      });
    }
    
    /* check if date-picker or range-slider changed their values, remove 
    class booking from tables and updates DOM */
    thisBooking.dom.wrapper.addEventListener('updated', function(event) {
      if(event.srcElement.classList.contains('date-picker') || event.srcElement.classList.contains('range-slider')) {
        thisBooking._removeActiveClassFromTables();
      }
      thisBooking.updateDOM();
    });
    /* Set table reservation event listener "submit" */
    thisBooking.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisBooking.sendReservation();
    });
  }

  sendReservation() {
    const thisBooking = this;

    //const url = settings.db.url + '/' + settings.db.booking;

    if(!thisBooking.activeTable) {
      alert('Not a number');
    } else {
      
      console.log('date:', thisBooking.datePicker.value);
      console.log('hour:', thisBooking.hourPicker.value);
      console.log('table:', thisBooking.activeTable);
      console.log('duration:', thisBooking.hoursAmount.value);
      console.log('ppl:', thisBooking.peopleAmount.value);
      console.log('thisBooking.dom.phone.value:', thisBooking.dom.phone.value);
      console.log('thisBooking.dom.address.value:', thisBooking.dom.address.value);
      
      for (let starter of this.dom.starters) {
        if (starter.checked === true) {
          console.log('starter.value:', starter.value);
          //booking.starters.push(starter.value);
        }
      }
    }
    /*
    "date": "2020-03-11",
      "hour": "16:00",
      "table": 3,
      "duration": 1,
      "ppl": 4,
      "starters": ["water"]


    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: thisBooking.activeTable,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,

  
    };

    for (let product of thisBooking.products) {
      payload.products.push(product.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    
    };

    fetch(url, options)
      .then(function(response) {
        return response.json();
      });
      */
  }

  /* Helper function - removes class booking from all tables */
  _removeActiveClassFromTables() {
    const thisBooking = this;

    for(let tbl of thisBooking.dom.tables) {
      tbl.classList.remove(classNames.booking.tableInBooking);
      thisBooking.activeTable = '';
    }
  }

}

export default Booking;