describe('Pokemon Search', () => {
  beforeEach(() => {
    cy.visit('/pokedex/1');
  });

  it('should search for a pokemon and display details', () => {
    cy.get('[data-testid="search-input"]').type('pikachu');

    cy.get('[data-testid="pokemon-card-pikachu"]')
      .should('exist')
      .and('contain', 'pikachu');

    cy.get('a[href="/pokemon/Pikachu"]').click();

    cy.url({ timeout: 15000 }).should('include', '/pokemon/');

    cy.get('[data-testid="pokemon-details"]')
      .should('exist')
      .and('be.visible')
      .and('contain', 'Height')
      .and('contain', 'Weight');

    cy.get('[data-testid="pokemon-details"]', { timeout: 20000 })
      .should('exist')
      .and('contain', 'Electric')
      .and('contain', 'Base experience');
  });

  it('should handle search with no results', () => {
    cy.get('[data-testid="search-input"]')
      .type('nonexistentpokemon{enter}');

    cy.get('[data-testid="no-results"]')
      .should('exist')
      .and('contain', 'No Pokémon found with that name');
  });
});
