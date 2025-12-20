Feature: Search & Map functionality
  As a user
  I want to search for therapy groups by location
  So that I can find relevant groups near me

  @smoke @test
  Scenario: Search by location triggers results and updates map
    Given I open the Search & Map page
    When I search for "Berlin"
    Then I should see results loaded