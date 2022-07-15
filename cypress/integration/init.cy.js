/// <reference types="cypress" />

const baseURL =
  'https://notificationapi-com.github.io/notificationapi-js-client-sdk/';
const URIs = ['vanillajs', 'reactjs', 'reactts'];

URIs.forEach((URI) => {
  describe(`init ${URI}`, () => {
    beforeEach(() => {
      cy.visit(baseURL + URI);
      cy.wait(2000); // wait for websocket, etc.
    });

    it(`shows the inapp button in ${URI}`, () => {
      cy.get('.notificationapi-button').should('have.length', 1);
    });
  });
});
