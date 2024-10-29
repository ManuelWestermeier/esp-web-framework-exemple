#ifndef FILE_ADMINPAGE_HTML
#define FILE_ADMINPAGE_HTML

String frontend::ADMINPAGE_HTML() {
    return String("<!DOCTYPE html>\r\n<html lang=\"en\">\r\n\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>Admin Page</title>\r\n    <link rel=\"stylesheet\" href=\"/css/index.css\">\r\n</head>\r\n\r\n<body>\r\n    <h1>\r\n        Led Control\r\n    </h1>\r\n    <a href=\"/H\">\r\n        Turn LED ON\r\n    </a>\r\n    <a href=\"/L\">\r\n        Turn LED OFF\r\n    </a>\r\n</body>\r\n\r\n</html>");
}

#endif // FILE_ADMINPAGE_HTML