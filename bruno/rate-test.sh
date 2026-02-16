#!/bin/bash

echo "Starting rate limit test..."

for i in {1..110}
do
  status=$(curl -s -o /dev/null -w "http://localhost:3000/api/users/1" \
    -H "Authorization: Bearer token2" \
    http://localhost:3000/api/users)

  echo "Request $i → $status"
done


