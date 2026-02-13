import { createClient } from "@twilio/flex-sdk";

createClient("your_token_here").then((client) => {
    console.log("Twilio Flex SDK Client initialized:", client);
});
