#include <Arduino.h>
#include <String.h>
#include <WiFi.h>
#include <WebServer.h>

#include "./frontend-out/include.hpp"

// WiFi credentials
const char *ssid = "WLAN2-001175";
const char *password = "OscarsRpt01";

// Fixed IP configuration
IPAddress localIP(192, 168, 8, 101);  // Set your fixed IP
IPAddress gateway(192, 168, 8, 1);    // Your gateway IP
IPAddress subnet(255, 255, 255, 0);   // Subnet mask

WebServer server(80);  // Create a web server on port 80

void handleRoot() {
  server.send(200, "text/html", frontend::ADMINPAGE_HTML().c_str());
}

void handleCSSIndex() {
  server.send(200, "text/css", frontend::CSS_INDEX_CSS().c_str());
}

void handleLEDOn() {
  digitalWrite(2, HIGH);  // Turn the LED on
  server.send(200, "text/plain", "LED is ON");
}

void handleLEDOff() {
  digitalWrite(2, LOW);  // Turn the LED off
  server.send(200, "text/plain", "LED is OFF");
}

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);  // Set the LED pin mode (on pin 2)

  delay(10);

  Serial.print("Connecting to ");
  Serial.println(ssid);

  // Configure the static IP
  if (!WiFi.config(localIP, gateway, subnet)) {
    Serial.println("Failed to configure IP!");
  }

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Define the request handlers
  server.on("/", HTTP_GET, handleRoot);
  server.on("/H", HTTP_GET, handleLEDOn);
  server.on("/L", HTTP_GET, handleLEDOff);
  server.on("/css/index.css", handleCSSIndex);

  server.begin();  // Start the server
}

void loop() {
  server.handleClient();  // Handle incoming client requests
}
