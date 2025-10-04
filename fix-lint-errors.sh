#!/bin/bash

# Fix unused error variables in catch blocks
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/} catch (error) {/} catch (_error) {/g' {} \;

# Fix unused mode parameter
sed -i 's/mode: '\''r'\'' | '\''rw'\'' = '\''rw'\''/\_mode: '\''r'\'' | '\''rw'\'' = '\''rw'\''/g' src/app/db/transaction.ts

echo "Fixed common linting errors"
