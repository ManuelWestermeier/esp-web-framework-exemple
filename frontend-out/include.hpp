#ifndef FRONTEND_INCLUDEFILE
#define FRONTEND_INCLUDEFILE
#include <Arduino.h>

namespace frontend {
  String ADMINPAGE_HTML();
  String CSS_INDEX_CSS();
}

#include "./ADMINPAGE_HTML.cpp"
#include "./CSS_INDEX_CSS.cpp"
#endif //FRONTEND_INCLUDEFILE