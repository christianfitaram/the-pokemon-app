describe('Pokemon Search', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should search for a pokemon and display details', () => {
    cy.get('[data-testid="search-input"]').type('pikachu');

    cy.get('[data-testid="pokemon-card-pikachu"]')
      .should('exist')
      .and('contain', 'pikachu');

    cy.get('[data-testid="pokemon-card-pikachu"]').click();

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
