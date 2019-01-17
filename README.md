# node-attendance-app

a personal project to demostrate my level of knowledge in JS, node, mongo and more. the project's purpose is to serve as an attendance app combined with an actuall RFID reader.

the exacution flow is as fallows:
worker passes card in front of RFID module -> raspberry pi reads the RFID tag number and sends it through Mqtt protocol to an open server -> the main node app, which is subscribed to those messages, gets the message and checks if the RFID tag number is in the MongoDB: if so - it will send back a confirmation message and update the db with the datetime in which the user passed the card. if it does not find the RFID tag number, it will only send a message that the server failed to find the user. the raspberry pi will blink/make a sound accordingly.

the manager has a dashbord where he can view all entries of workers according to custom datetime ranges. he also has the ability to add a new worker or add/remove a timestamp from a certain worker. of course the manager has a login page and a reset password page.




* a work in progress
