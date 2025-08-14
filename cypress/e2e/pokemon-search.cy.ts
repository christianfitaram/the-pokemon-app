describe('Pokemon Search', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should search for a pokemon and display details', () => {
    // Search for a pokemon
    cy.get('[data-testid="search-input"]')
        .wait(4000)
      .type('pikachu');

    // Verify the pokemon card appears
    cy.get('[data-testid="pokemon-card-pikachu"]')
      .should('exist')
      .and('contain', 'pikachu');

    // Click on the pokemon card
    cy.get('[data-testid="pokemon-card-pikachu"]').click();

    cy.wait(3000);
    // Verify detailed information is displayed
    cy.get('[data-testid="pokemon-details"]')
      .should('exist')
      .and('contain', 'Electric')
      .and('contain', 'Height')
      .and('contain', 'Weight');
  });

  it('should handle search with no results', () => {
    cy.get('[data-testid="search-input"]')
      .type('nonexistentpokemon{enter}');

    cy.get('[data-testid="no-results"]')
      .should('exist')
      .and('contain', 'No Pokémon found with that name');
  });
});
