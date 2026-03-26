FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY pom.xml /app/pom.xml
COPY src /app/src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/target/java-checkout-0.0.1.jar /app/app.jar

EXPOSE 8081

CMD ["java", "-jar", "/app/app.jar"]
