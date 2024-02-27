/// <reference types="cypress" />

const baseURL =
  'https://notificationapi-com.github.io/notificationapi-js-client-sdk/';

const URIs = ['vanillajs', 'reactjs', 'reactts', 'vitereactts'];

URIs.forEach((URI) => {
  describe(`init ${URI}`, () => {
    beforeEach(() => {
      let url = baseURL + URI;
      if (Cypress.env('TESTING_MODE') === 'LIVE') url = url + '-live';
      cy.visit(url);
      cy.wait(2000); // wait for websocket, etc.
    });

    it(`shows the inapp button in ${URI}`, () => {
      cy.get('.notificationapi-button').should('have.length', 1);
    });

    it(`with styles ${URI}`, () => {
      cy.get('.notificationapi-button').should('have.css', 'width', '32px');
    });
  });
});
