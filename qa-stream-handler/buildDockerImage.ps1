$containerName = "qa-stream-handler"
$networkName = "custom0"
$localPort = 3002
$containerPort = 8002
$imageName = "qa-stream-handler"
$tag = "v2"

# Tagging to push image to a cloud registry
# $repo = "ta4h1r"
# docker tag ${imageName}:${tag} ${repo}/${imageName}:${tag}
# docker push ${repo}/${imageName}:${tag}

# Basic build and run
docker build -t ${imageName}:${tag} .
docker run -itd --name=$containerName --network=$networkName -p ${localPort}:${containerPort} ${imageName}:${tag}
