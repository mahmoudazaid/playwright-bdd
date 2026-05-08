Feature: Login
  As a shopper
  I want to sign in to Swag Labs
  So that I can browse the product catalog

  @smoke @test
  Scenario: Successful login with standard user
    Given I am on the login page
    When I log in as "standard_user" with password "secret_sauce"
    Then I should land on the inventory page
