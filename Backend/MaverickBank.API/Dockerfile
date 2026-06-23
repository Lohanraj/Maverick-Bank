# Use official Microsoft ASP.NET Core runtime as base
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Use .NET SDK to compile and build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["MaverickBank.API.csproj", "./"]
RUN dotnet restore "./MaverickBank.API.csproj"

# Copy the remaining files and build the app
COPY . .
RUN dotnet build "MaverickBank.API.csproj" -c Release -o /app/build

# Publish the app
FROM build AS publish
RUN dotnet publish "MaverickBank.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image copy published output and set entry point
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MaverickBank.API.dll"]
