# PDF-READER
Browser based PDF Reader which supports simple functions such as Zoomin, Zoom out, NextPage and Previous Page features which can be controlled by Gestures.

The code used Tensorflow model for image identification which is a Deep Neural Network in the form of modified mobilenet. The model is further used in a Tensorflow JS format.

Description of Files:

1)Setup.html:   It is the html file which sets up the environment for the application to run.. It defines the inclusion of source files as well as defining the window for rendering PDF file, the buttons as the webcam Window.

2) Index.js: It is the main Driver code javascript file which controls the functionality and calls the other files for use.

3) Webcam.js: It is the setup file for webcam functioning

4) rps_dataset.js : It is used to create a temperory dataset of the user defined gestures for training the model.
