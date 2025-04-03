docker build -t celebrator -f docker/Dockerfile .
docker run -d \
  --name celebrator \
  -v $(pwd)/src/data:/home/celebrator/src/data \
  -v $(pwd)/logs:/logs \
  celebrator
