$containerName = "qa-webui-handler"
$networkName = "custom0"
$localPort = 3000
$containerPort = 8000
$imageName = "qa-webui-handler"
$tag = "v2"

# Tagging to push image to a cloud registry
# $repo = "ta4h1r"
# docker tag ${imageName}:${tag} ${repo}/${imageName}:${tag}
# docker push ${repo}/${imageName}:${tag}

# Basic build and run
docker build -t ${imageName}:${tag} .
docker run -itd --name=$containerName --network=$networkName -p ${localPort}:${containerPort} ${imageName}:${tag}