#!/bin/bash

# Test monitoring script
# Provides real-time status of test execution

LOG_DIR="/tmp/fitness_app_tests"
PROGRESS_FILE="$LOG_DIR/test_progress.txt"
LOG_FILE="$LOG_DIR/test_execution.log"
BACKGROUND_LOG="$LOG_DIR/background_execution.log"
PID_FILE="$LOG_DIR/test_runner_pid.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}🔍 FITNESS APP TEST MONITOR${NC}"
echo -e "${BLUE}============================${NC}"
echo ""

# Check if test runner is active
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Test runner is ACTIVE (PID: $PID)${NC}"
    else
        echo -e "${RED}⏹️  Test runner is STOPPED${NC}"
    fi
else
    echo -e "${YELLOW}❓ No test runner found${NC}"
fi

echo ""

# Show current progress
if [ -f "$PROGRESS_FILE" ]; then
    PROGRESS=$(cat "$PROGRESS_FILE" 2>/dev/null || echo "Starting...")
    echo -e "${BLUE}📊 Current Progress: ${YELLOW}$PROGRESS${NC}"
else
    echo -e "${YELLOW}📊 Progress: Not yet started${NC}"
fi

echo ""

# Show recent log entries
if [ -f "$LOG_FILE" ]; then
    echo -e "${BLUE}📋 Recent Activity (last 10 entries):${NC}"
    echo -e "${BLUE}================================${NC}"
    tail -10 "$LOG_FILE" 2>/dev/null | while read line; do
        echo -e "${NC}$line"
    done
else
    echo -e "${YELLOW}📋 No activity log found yet${NC}"
fi

echo ""

# Show test results summary from current TEST_OVERVIEW.md
if [ -f "TEST_OVERVIEW.md" ]; then
    TOTAL_LINES=$(grep -c "^|.*npx vitest run" "TEST_OVERVIEW.md" 2>/dev/null || echo "0")
    PASS_COUNT=$(grep -c "| PASS" "TEST_OVERVIEW.md" 2>/dev/null || echo "0")
    FAIL_COUNT=$(grep -c "| FAIL" "TEST_OVERVIEW.md" 2>/dev/null || echo "0")
    SKIP_COUNT=$(grep -c "| SKIP" "TEST_OVERVIEW.md" 2>/dev/null || echo "0")
    
    echo -e "${BLUE}📈 Current Results Summary:${NC}"
    echo -e "${BLUE}===========================${NC}"
    echo -e "🧪 Tests completed: $TOTAL_LINES"
    echo -e "✅ Passed: ${GREEN}$PASS_COUNT${NC}"
    echo -e "❌ Failed: ${RED}$FAIL_COUNT${NC}"
    echo -e "⏭️ Skipped: ${YELLOW}$SKIP_COUNT${NC}"
else
    echo -e "${YELLOW}📈 No results file found yet${NC}"
fi

echo ""
echo -e "${BLUE}📝 Available Commands:${NC}"
echo "• ./monitor_tests.sh - Run this monitor again"
echo "• tail -f $PROGRESS_FILE - Watch progress live"
echo "• tail -f $LOG_FILE - Watch detailed logs"
echo "• tail -f $BACKGROUND_LOG - Watch background execution"
if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
    echo "• kill $(cat "$PID_FILE") - Stop test execution"
fi
echo ""