import {loadScript} from 'https://cdn.jsdelivr.net/npm/@paypal/paypal-js@8.1.2/+esm';

class Year extends HTMLElement{
    connectedCallback(){
        this.innerHTML = new Date().getFullYear();
    }
}

customElements.define("x-date", Year);

class PayPal extends HTMLElement{
    async connectedCallback(){
        const res = await fetch(`${import.meta.url.replace("index.js", "clientid")}`)
        const oClient = await res.json();
        this.innerHTML = `
        <div id="paypal-button-container"></div>

        <p id="result-message"></p>
         `
         let paypal;

         try {
             paypal = await loadScript({ clientId: oClient.clientid });
         } catch (error) {
             console.error("failed to load the PayPal JS SDK script", error);
         }
         
         if (paypal) {
             try {
                 await paypal.Buttons().render("#paypal-button-container");
             } catch (error) {
                 console.error("failed to render the PayPal Buttons", error);
             }
         }         
        }
}

customElements.define("x-paypal", PayPal)