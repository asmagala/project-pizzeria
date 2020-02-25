import {select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on tamplate */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements() {
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() {
    const thisProduct = this;

    /* START: click event listener to trigger */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {
      /* prevent default action for event */
      event.preventDefault();
      const thisTrigger = this;
      
      /* toggle active class on element of thisProduct */
      thisTrigger.parentElement.classList.add(classNames.menuProduct.wrapperActive);
      
      /* find all active products */
      const activeProducts = document.querySelectorAll('article.product.active');
      
      /* START LOOP: for each active product */
      for(let activeProduct of activeProducts) {

        /* Start: if the active product isn't the element of thisProduct */
        if(activeProduct !== thisProduct.element) {

          /* remove class active for the active product */
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);

        /* END: if the active product isn't the element of thisProduct */
        }
        /* END LOOP: for each active product */
      }
      /* END: click event listener to trigger */
    });
  }

  initOrderForm() {
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs) {
      input.addEventListener('change', function() {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder() {
    const thisProduct = this;
   
    const formData = utils.serializeFormToObject(thisProduct.form);

    thisProduct.params = {};
    let params = thisProduct.data.params;

    let price = thisProduct.data.price;

    for (let paramId in params) {

      const param = params[paramId];
      for (let optionId in param.options ) {
        const option = param.options[optionId];

        const optionSelected = formData.hasOwnProperty(paramId) && (formData[paramId].indexOf(optionId) !== -1);
        
        if (optionSelected && !option.default) {
          price += option.price;
        } else if ((!optionSelected) && (option.default)) {
          price -= option.price;
        }

        const imgClassName = '.' + paramId + '-' + optionId;
        const imgs = thisProduct.imageWrapper.querySelectorAll(imgClassName);
        if ((optionSelected) && !thisProduct.params[paramId]) {
          thisProduct.params[paramId] = {
            label: param.label,
            options: {},
          };
        
          thisProduct.params[paramId].options[optionId] = option.label;
          for (let img of imgs) {
            img.classList.add(classNames.menuProduct.imageVisible);
          }
        } else {
          for ( let img of imgs) {
            img.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }
    /* multiply price by amount */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    thisProduct.priceElem.innerHTML = thisProduct.price;
  }

  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;
    
    //app.cart.add(thisProduct);
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;