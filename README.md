# Flex SDK Demo

## Why

This is a sample app to demonstrate the use of Flex SDK to build standalone apps with the framework of your choice. It uses APIs and [EventListeners](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events) to manage the user session and listen for incoming events.

Some prerequisites to run this application are as follows:

-   You should have a Twilio Flex account
-   You have a verified Phone number for your Flex instance
-   Your Studio Flow is correctly configured with your Flex instance
-   Your Flex account is correctly configured with Enhanced SSO or you have a service capable of provisioning a user authentication token

-   [Flex SDK Demo](#flex-sdk-demo)
    -   [Why](#why)
    -   [SSO setup](#sso-setup)
    -   [Prerequisites](#prerequisites)
    -   [Getting Started](#getting-started)
    -   [Installation](#installation)
    -   [Usage](#usage)
        -   [Running the application locally](#running-the-application-locally)
        -   [Usage](#usage-1)

## SSO setup

-   Go to SSO settings page of your Twilio Flex account - you will be able to see ACS url and entity ID for the OAuth 2.0 connection associated with your account
-   Follow this [doc](https://www.twilio.com/docs/flex/admin-guide/setup/sso-configuration#enhanced-and-legacy-sso-configuration) for the SSO setup and refer to the values mentioned under Enhanced SSO configuration. You will find those values in the above step in Console.
-   In order to run this sample app locally, add `http://localhost:5173/agentDesktop` to "Trusted URLs" in [SSO Configuration](https://console.twilio.com/us1/develop/flex/users-and-access/single-sign-on)

## Prerequisites

This project requires NodeJS (version 14 or later) and NPM (version 8 or later). Node and NPM are really easy to install. To make sure you have them available on your machine, try running the following command.

```sh
$ npm -v && node -v
v8.1.0
v16.13.0
```

## Getting Started

In order to run the application follow this guideline

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

Start with cloning this repo on your local machine:

```sh
$ git clone https://github.com/twilio/flex-sdk-demo.git
$ cd flex-sdk-demo
```

To install and set up the library, run:

```sh
$ npm install
```

## Usage

### Running the application locally

```sh
$ npm run dev
```

Open your browser at [localhost:5173](http://localhost:5173/)

### Usage

One of the most common use cases that we try out in the application is triggering an incoming call, accepting it and after the call is complete, end it, and complete the task. 

-   You can trigger an incoming call using the [twilio-dev-phone](https://www.twilio.com/docs/labs/dev-phone)
-   Accept the call
-   Once done end the call and complete the task
