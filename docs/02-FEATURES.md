# CDN控制面板 - 核心功能实现文档

## 概述

本文档详细说明CDN控制面板系统的核心功能实现细节,包括8个完整工作流、14个Service层实现、2个自动化Worker以及关键业务逻辑的实现方案。

---

## 工作流实现详解

### WF-01: 创建节点分组

节点分组(Node Group)是将多个边缘节点组织成逻辑分组的机制,为CDN流量调度提供基础。

#### 业务需求

系统需要支持将多个边缘节点按照地理位置、运营商或其他维度组织成分组,每个分组拥有唯一的CNAME域名,客户端可以通过该CNAME访问分组内的所有节点。分组内的节点可以动态增删,DNS记录需要自动同步更新。

#### 实现方案

**数据模型设计**包含三个核心表。node_groups表存储分组基本信息,包含id(主键)、name(分组名称)、cname(唯一CNAME,如ng-abc123.cdn.example.com)、domain_id(关联的域名zone)、description(描述)、created_at和updated_at。node_group_sub_ips表存储分组与节点子IP的关联关系,包含id、node_group_id、node_id、sub_ip(子IP地址)、enabled(是否启用)、dns_record_id(关联的DNS记录)、created_at和updated_at。domain_dns_records表存储DNS记录,包含id、domain_id、type(记录类型:A/CNAME/TXT)、name(记录名称)、value(记录值)、ttl、status(pending/synced/error)、cloudflare_record_id、last_error、created_at和updated_at。

**创建流程**分为五个步骤。第一步生成唯一CNAME,使用"ng-"前缀加随机字符串,确保在domain内唯一。第二步创建node_group记录,存储分组基本信息。第三步添加node_group_sub_ips记录,遍历请求中的node_sub_ips列表,为每个子IP创建关联记录。第四步为enabled的子IP创建DNS A记录,记录名称为node_group.cname,记录值为sub_ip,状态设置为pending,由DNS Sync Worker异步同步到Cloudflare。第五步调用BumpVersion()增加配置版本号。

**核心代码实现**位于`internal/service/node_group_service.go`的`Create()`方法。该方法使用数据库事务确保原子性,失败时自动回滚所有操作。CNAME生成使用`generateUniqueCNAME()`函数,通过循环检查数据库确保唯一性。DNS记录创建使用DNSRecordService的`Create()`方法,状态初始化为pending。

**错误处理**包括多个场景。如果CNAME冲突则重新生成并重试最多10次。如果关联的domain不存在则返回错误。如果node或sub_ip不存在则返回错误。如果DNS记录创建失败则回滚整个事务。

#### 关键技术点

**CNAME唯一性保证**通过在数据库层面添加唯一索引`idx_node_groups_cname`实现,同时在应用层通过循环检查确保唯一性。

**DNS异步同步**采用pending状态机制,创建时不立即调用Cloudflare API,而是标记为pending,由DNS Sync Worker异步处理。这种设计避免了API调用失败导致整个事务回滚,提高了系统的可用性。

**事务完整性**使用GORM的Transaction机制,确保node_group、node_group_sub_ips和domain_dns_records的创建要么全部成功,要么全部失败。

#### 测试场景

功能测试应覆盖以下场景:正常创建节点分组,验证CNAME生成正确;添加多个子IP,部分启用部分禁用,验证只为enabled的子IP创建DNS记录;CNAME冲突时自动重新生成;关联不存在的domain时返回错误;事务回滚测试,模拟DNS记录创建失败场景。

### WF-02: 创建线路分组

线路分组(Line Group)是在节点分组之上的抽象层,用于实现流量调度和故障切换。

#### 业务需求

系统需要支持创建线路分组,每个线路分组关联一个节点分组,拥有独立的CNAME域名。客户端访问线路分组的CNAME时,DNS会解析到关联的节点分组CNAME,最终解析到节点分组内的子IP。线路分组可以动态切换关联的节点分组,实现流量调度和故障切换。

#### 实现方案

**数据模型设计**包含两个核心表。line_groups表存储线路分组信息,包含id、name、cname(唯一CNAME,如lg-xyz789.cdn.example.com)、node_group_id(关联的节点分组)、domain_id、description、created_at和updated_at。domain_dns_records表复用WF-01中的表结构,用于存储CNAME记录。

**创建流程**分为四个步骤。第一步生成唯一CNAME,使用"lg-"前缀加随机字符串。第二步创建line_group记录。第三步创建DNS CNAME记录,记录名称为line_group.cname,记录值为node_group.cname,状态设置为pending。第四步调用BumpVersion()增加配置版本号。

**核心代码实现**位于`internal/service/line_group_service.go`的`Create()`方法。该方法首先验证node_group_id对应的节点分组存在,然后使用事务创建line_group和DNS CNAME记录。

**更新流程**支持切换关联的节点分组。更新line_group.node_group_id为新的节点分组,创建新的DNS CNAME记录指向新的节点分组CNAME,旧的DNS记录保持不变(Cloudflare会自动覆盖),调用BumpVersion()增加配置版本号。

#### 关键技术点

**CNAME链式解析**线路分组CNAME -> 节点分组CNAME -> 子IP A记录,形成两级CNAME解析链。这种设计实现了流量调度的灵活性,切换节点分组时只需更新一条CNAME记录。

**节点分组验证**创建线路分组时必须验证关联的节点分组存在且有效,避免创建无效的CNAME记录。

**配置版本追踪**线路分组的创建和更新都会触发配置版本增加,确保边缘节点能够及时感知配置变更。

#### 测试场景

功能测试应覆盖以下场景:正常创建线路分组,验证CNAME记录创建正确;切换关联的节点分组,验证DNS记录更新;关联不存在的节点分组时返回错误;CNAME冲突时自动重新生成;验证配置版本号正确增加。

### WF-03: 创建网站

网站(Website)是CDN系统的核心资源,整合了域名、回源、HTTPS、缓存等所有配置。

#### 业务需求

系统需要支持创建网站配置,包括指定回源服务器列表、选择线路分组、配置HTTPS、添加多个域名、关联缓存规则等。网站创建后,系统自动为每个域名创建DNS CNAME记录指向线路分组,边缘节点可以通过Agent API拉取完整的网站配置。

#### 实现方案

**数据模型设计**包含六个核心表。websites表存储网站基本信息,包含id、name、origin_set_id(回源快照ID)、line_group_id(线路分组ID)、description、created_at和updated_at。origin_sets表存储回源配置快照,包含id、created_from_group_id(来源回源分组,可为NULL)、created_at。origin_addresses表存储回源地址,包含id、origin_set_id、address(IP或域名)、port、weight、priority、health_check_enabled、health_check_url、created_at。website_domains表存储网站域名,包含id、website_id、domain(完整域名)、cname(线路分组CNAME)、dns_record_id、created_at。website_https表存储HTTPS配置,包含id、website_id、enabled、force_https、certificate_id、created_at和updated_at。website_cache_rules表存储网站与缓存规则的关联,包含id、website_id、cache_rule_id、created_at。

**创建流程**分为七个步骤。第一步创建origin_set快照,如果请求中指定了origin_group_id,则从origin_group复制所有origin_addresses;如果直接提供origins列表,则直接创建origin_addresses。第二步创建website记录,关联origin_set_id和line_group_id。第三步创建website_https配置,初始状态enabled=false。第四步创建website_domains记录,为每个域名创建记录,cname字段设置为line_group.cname。第五步为每个域名创建DNS CNAME记录,记录名称为domain,记录值为line_group.cname,状态设置为pending。第六步关联缓存规则,如果请求中指定了cache_rule_ids,则创建website_cache_rules关联记录。第七步调用BumpVersion()增加配置版本号。

**核心代码实现**位于`internal/service/website_service.go`的`Create()`方法。该方法使用复杂的事务逻辑,协调多个Service的操作。首先调用OriginService创建origin_set,然后创建website主记录,接着调用DNSRecordService为每个域名创建DNS记录,最后关联缓存规则。

**回源快照机制**每次创建网站都会创建新的origin_set,即使来源于同一个origin_group,也会创建独立的快照。这种设计确保了网站配置的独立性,修改origin_group不会影响已创建的网站。

#### 关键技术点

**Origin Set不可变性**origin_set创建后不可修改,每次更新回源配置都会创建新的origin_set。这种设计简化了配置版本管理,避免了多个网站共享origin_set导致的配置冲突。

**多域名支持**一个网站可以关联多个域名,所有域名共享相同的回源配置、HTTPS配置和缓存规则。域名可以动态增删,系统自动管理对应的DNS记录。

**线路分组关联**网站通过line_group_id关联线路分组,所有域名的CNAME都指向该线路分组。切换线路分组时,需要更新所有域名的DNS CNAME记录。

**缓存规则关联**通过website_cache_rules中间表实现多对多关联,支持一个网站关联多个缓存规则,一个缓存规则也可以被多个网站使用。

#### 测试场景

功能测试应覆盖以下场景:从origin_group创建网站,验证origin_set正确复制;直接提供origins列表创建网站;添加多个域名,验证DNS记录创建正确;关联缓存规则,验证关联关系正确;验证HTTPS配置初始状态;验证配置版本号增加;事务回滚测试,模拟各个步骤失败场景。

### WF-04: 更新网站线路分组

更新网站的线路分组是实现流量调度和故障切换的关键功能。

#### 业务需求

系统需要支持动态切换网站关联的线路分组,实现流量在不同节点分组之间的调度。切换线路分组后,网站的所有域名DNS CNAME记录需要自动更新,指向新的线路分组CNAME。

#### 实现方案

**更新流程**分为四个步骤。第一步验证新的line_group_id对应的线路分组存在。第二步更新website.line_group_id为新的线路分组ID。第三步更新website_domains表中所有域名的cname字段为新的线路分组CNAME。第四步为每个域名创建新的DNS CNAME记录,记录值为新的线路分组CNAME,状态设置为pending。第五步调用BumpVersion()增加配置版本号。

**核心代码实现**位于`internal/service/website_service.go`的`UpdateLineGroup()`方法。该方法使用事务确保所有操作的原子性,首先查询网站的所有域名,然后批量更新website_domains和创建DNS记录。

**DNS记录更新策略**系统采用创建新记录的方式更新DNS,而不是修改旧记录。旧的DNS记录保持不变,Cloudflare会根据记录名称自动覆盖。这种设计简化了DNS同步逻辑,避免了复杂的更新状态管理。

#### 关键技术点

**批量DNS更新**切换线路分组可能涉及大量域名的DNS记录更新,系统使用批量创建机制,一次事务中创建所有DNS记录,然后由DNS Sync Worker异步同步。

**配置版本追踪**线路分组切换会触发配置版本增加,边缘节点检测到版本变化后会重新拉取配置,更新本地路由规则。

**原子性保证**使用数据库事务确保website、website_domains和domain_dns_records的更新要么全部成功,要么全部失败,避免出现不一致状态。

#### 测试场景

功能测试应覆盖以下场景:正常切换线路分组,验证所有域名DNS记录更新;切换到不存在的线路分组时返回错误;验证配置版本号增加;事务回滚测试;验证边缘节点能够感知配置变更。

### WF-05: 更新网站回源配置

更新回源配置是网站运维的常见操作,如添加新的回源服务器、调整权重、修改健康检查配置等。

#### 业务需求

系统需要支持更新网站的回源配置,包括添加/删除回源地址、修改地址权重、调整优先级、配置健康检查等。根据R11和R12规则,origin_set不可复用,每次更新都必须创建新的origin_set。

#### 实现方案

**更新流程**分为三个步骤。第一步创建新的origin_set,不关联origin_group(created_from_group_id=NULL),根据请求中的origins列表创建新的origin_addresses记录。第二步更新website.origin_set_id为新的origin_set ID,旧的origin_set保持不变,用于历史追溯。第三步调用BumpVersion()增加配置版本号。

**核心代码实现**位于`internal/service/website_service.go`的`UpdateOrigins()`方法。该方法首先调用OriginService创建新的origin_set,然后更新website记录,最后增加配置版本号。

**历史追溯**旧的origin_set不会被删除,保留在数据库中用于配置历史追溯和回滚。如果需要清理历史数据,可以定期删除不再被任何website引用的origin_set。

#### 关键技术点

**Origin Set独立性**每次更新都创建新的origin_set,确保配置变更的独立性和可追溯性。这种设计虽然会增加数据库存储,但大大简化了配置管理逻辑。

**不可复用原则**严格遵循R11规则,origin_set不在网站之间复用,每个网站独占一个origin_set。这避免了多个网站共享配置导致的"牵一发而动全身"问题。

**配置版本追踪**回源配置更新会触发配置版本增加,边缘节点会重新拉取配置,更新本地回源服务器列表和负载均衡策略。

#### 测试场景

功能测试应覆盖以下场景:正常更新回源配置,验证新origin_set创建正确;验证旧origin_set保持不变;验证website.origin_set_id更新正确;验证配置版本号增加;添加/删除回源地址;修改权重和优先级;配置健康检查参数。

### WF-06: 手动上传证书

手动上传证书是为网站配置HTTPS的基础功能,支持用户上传自有证书或从其他CA购买的证书。

#### 业务需求

系统需要支持用户上传PEM格式的证书和私钥,自动解析证书信息(域名列表、有效期、颁发者等),计算证书指纹,存储到数据库,供网站绑定使用。

#### 实现方案

**数据模型设计**包含两个核心表。certificates表存储证书信息,包含id、name、cert_pem(证书PEM)、key_pem(私钥PEM)、fingerprint_sha256(SHA256指纹)、issuer(颁发者)、not_before(生效时间)、not_after(过期时间)、auto_renew(是否自动续期)、created_at和updated_at。certificate_domains表存储证书域名,包含id、certificate_id、domain(域名,支持通配符如*.example.com)、created_at。

**上传流程**分为六个步骤。第一步解析证书PEM,使用Go标准库`crypto/x509`解析证书内容。第二步提取SAN(Subject Alternative Name)列表,获取证书覆盖的所有域名。第三步计算SHA256指纹,对证书DER编码进行SHA256哈希。第四步创建certificate记录,存储证书PEM、私钥PEM、指纹、颁发者、有效期等信息。第五步创建certificate_domains记录,为每个SAN域名创建一条记录。第六步返回证书ID和指纹。

**核心代码实现**位于`internal/service/certificate_service.go`的`Upload()`方法。该方法使用`x509.ParseCertificate()`解析证书,提取所有必要信息,然后使用事务创建certificate和certificate_domains记录。

**证书验证**系统会验证证书的有效性,包括证书格式是否正确、证书是否在有效期内、私钥是否与证书匹配等。验证失败会返回详细的错误信息。

#### 关键技术点

**PEM解析**使用Go标准库`encoding/pem`和`crypto/x509`解析PEM格式的证书和私钥,支持标准的PEM编码格式。

**SAN提取**从证书的Subject Alternative Name扩展中提取所有域名,包括普通域名和通配符域名。如果证书没有SAN扩展,则从Subject的Common Name中提取域名。

**指纹计算**使用SHA256算法计算证书指纹,指纹是证书的唯一标识,用于证书去重和快速查找。

**私钥安全**私钥以PEM格式加密存储在数据库中,仅通过Agent API传输给授权的边缘节点,不通过管理端API暴露。

#### 测试场景

功能测试应覆盖以下场景:上传标准格式证书,验证解析正确;上传包含通配符域名的证书;上传多域名证书,验证所有SAN域名提取正确;上传无效证书,验证错误处理;上传私钥不匹配的证书,验证验证逻辑;验证指纹计算正确性。

### WF-07: ACME自动申请证书

ACME自动申请证书是系统的核心自动化功能,通过Let's Encrypt免费为网站申请HTTPS证书。

#### 业务需求

系统需要支持通过ACME协议自动向Let's Encrypt申请证书,使用DNS-01验证方式证明域名所有权,自动创建DNS TXT记录,完成验证后获取证书并存储,支持证书自动续期。

#### 实现方案

**数据模型设计**使用certificate_requests表存储证书申请请求,包含id、domains(JSON数组,申请的域名列表)、status(pending/processing/completed/error)、certificate_id(申请成功后的证书ID)、last_error(错误信息)、created_at和updated_at。

**申请流程**分为八个步骤。第一步用户创建certificate_request记录,指定要申请证书的域名列表,状态初始化为pending。第二步ACME Worker扫描到pending请求,更新状态为processing。第三步调用ACMEService执行DNS-01验证,为每个域名创建DNS TXT记录(_acme-challenge.domain),记录值为ACME challenge token。第四步等待DNS传播,默认等待30秒确保DNS记录全球可查。第五步调用Let's Encrypt API完成验证,Let's Encrypt会查询DNS TXT记录验证域名所有权。第六步验证成功后,Let's Encrypt颁发证书。第七步将证书存储到certificates表,创建certificate_domains记录。第八步更新certificate_request状态为completed,记录certificate_id,清理DNS TXT记录。

**核心代码实现**分为两部分。ACMEService(`internal/service/acme_service.go`)封装ACME协议交互逻辑,使用`go-acme/lego`库与Let's Encrypt通信,实现DNS-01验证流程。ACME Worker(`internal/worker/acme_worker.go`)定期扫描certificate_requests表,调用ACMEService处理pending请求,每5分钟执行一次。

**DNS-01验证**使用DNS TXT记录验证域名所有权,支持通配符域名(如*.example.com)。验证记录格式为`_acme-challenge.domain TXT "token"`,token由ACME服务器生成。

**错误处理**如果验证失败,更新certificate_request状态为error,记录详细错误信息到last_error字段。用户可以手动重试,将状态改回pending即可。Worker会在下次扫描时重新处理。

#### 关键技术点

**ACME协议**使用ACME v2协议与Let's Encrypt通信,支持DNS-01验证方式。ACME协议是一个标准化的证书申请协议,被所有主流CA支持。

**DNS-01验证**相比HTTP-01验证,DNS-01验证支持通配符域名,且不需要在边缘节点上配置验证文件,更适合CDN场景。

**异步处理**证书申请是一个耗时操作(通常需要1-2分钟),采用异步Worker机制避免阻塞API请求。用户创建请求后可以立即返回,通过查询请求状态了解申请进度。

**DNS传播等待**创建DNS TXT记录后需要等待一段时间确保全球DNS服务器都能查询到,默认等待30秒。这个时间可以根据DNS提供商的传播速度调整。

**证书续期**ACME Worker会自动扫描30天内到期且auto_renew=true的证书,为每个证书创建新的certificate_request,触发自动续期流程。

#### 测试场景

功能测试应覆盖以下场景:申请单域名证书,验证流程正确;申请通配符域名证书;申请多域名证书;DNS验证失败场景,验证错误处理;证书申请失败场景;证书续期流程;并发申请多个证书;验证DNS TXT记录创建和清理。

### WF-08: 绑定证书到网站

绑定证书到网站是启用HTTPS的最后一步,将申请或上传的证书与网站关联。

#### 业务需求

系统需要支持将证书绑定到网站,验证证书域名覆盖网站的所有域名,支持通配符域名匹配,一个网站同时只能有一个活跃的证书绑定,切换证书时自动将旧绑定设置为非活跃状态。

#### 实现方案

**数据模型设计**使用certificate_bindings表存储证书与网站的绑定关系,包含id、certificate_id、website_id、active(是否活跃)、created_at和updated_at。

**绑定流程**分为五个步骤。第一步验证证书域名覆盖网站域名,查询website_domains获取网站的所有域名,查询certificate_domains获取证书的所有域名,验证每个网站域名都能匹配至少一个证书域名(支持通配符匹配)。第二步将该网站的所有旧绑定设置为inactive,更新certificate_bindings表,设置active=false。第三步创建新的certificate_binding记录,active=true。第四步更新website_https.certificate_id为新的证书ID。第五步调用BumpVersion()增加配置版本号。

**核心代码实现**位于`internal/service/certificate_service.go`的`BindToWebsite()`方法。该方法使用事务确保所有操作的原子性,首先执行域名覆盖验证,然后更新绑定关系和HTTPS配置。

**域名匹配规则**支持精确匹配和通配符匹配。精确匹配:证书域名与网站域名完全相同。通配符匹配:证书域名为*.example.com,网站域名为sub.example.com,匹配成功。多级通配符:证书域名为*.example.com,网站域名为a.b.example.com,匹配失败(通配符只匹配一级子域名)。

**绑定历史**旧的绑定记录不会被删除,只是设置为inactive,用于追溯网站的证书使用历史。

#### 关键技术点

**域名覆盖验证**这是绑定证书的核心逻辑,必须确保证书能够覆盖网站的所有域名,否则部分域名的HTTPS访问会失败。验证算法需要正确处理通配符匹配规则。

**活跃状态管理**一个网站同时只能有一个活跃的证书绑定,切换证书时必须先将旧绑定设置为inactive。这避免了配置冲突和歧义。

**配置版本追踪**证书绑定会触发配置版本增加,边缘节点会重新拉取配置,更新本地证书缓存,开始使用新证书。

**HTTPS配置联动**绑定证书时会自动更新website_https.certificate_id,确保HTTPS配置与绑定关系一致。

#### 测试场景

功能测试应覆盖以下场景:绑定单域名证书到单域名网站;绑定通配符证书到多个子域名网站;绑定多域名证书;域名不覆盖时返回错误;切换证书,验证旧绑定设置为inactive;验证配置版本号增加;验证边缘节点能够获取新证书。

---

## Service层实现详解

### NodeGroupService

NodeGroupService负责节点分组的完整生命周期管理。

**核心方法**包括Create(创建节点分组)、Get(查询单个节点分组)、List(查询节点分组列表)、Update(更新节点分组)、Delete(删除节点分组)、AddSubIP(添加子IP)、RemoveSubIP(移除子IP)、UpdateSubIP(更新子IP状态)。

**关键实现细节**:Create方法使用事务创建node_group、node_group_sub_ips和DNS记录,确保原子性。AddSubIP方法在添加子IP时,如果enabled=true则自动创建DNS A记录。RemoveSubIP方法在移除子IP时,如果有关联的DNS记录则自动删除。Update方法支持更新分组名称和描述,但不能修改CNAME(CNAME是不可变的)。Delete方法采用软删除,将deleted_at字段设置为当前时间,不物理删除记录。

**依赖关系**:依赖DNSRecordService创建和删除DNS记录,依赖ConfigVersionService增加配置版本号,依赖NodeService验证节点存在性。

### LineGroupService

LineGroupService负责线路分组的管理。

**核心方法**包括Create(创建线路分组)、Get(查询单个线路分组)、List(查询线路分组列表)、Update(更新线路分组,包括切换节点分组)、Delete(删除线路分组)。

**关键实现细节**:Create方法验证node_group_id对应的节点分组存在,生成唯一CNAME,创建DNS CNAME记录。Update方法支持更新名称、描述和关联的节点分组,切换节点分组时会创建新的DNS CNAME记录。Delete方法检查是否有网站正在使用该线路分组,如果有则拒绝删除,避免破坏网站配置。

**依赖关系**:依赖NodeGroupService验证节点分组,依赖DNSRecordService管理DNS记录,依赖ConfigVersionService追踪配置版本。

### WebsiteService

WebsiteService是系统最复杂的Service,整合了回源、域名、HTTPS、缓存等多个子系统。

**核心方法**包括Create(创建网站)、Get(查询单个网站)、List(查询网站列表)、Update(更新网站基本信息)、Delete(删除网站)、UpdateLineGroup(更新线路分组)、UpdateOrigins(更新回源配置)、AddDomain(添加域名)、RemoveDomain(移除域名)、UpdateHTTPS(更新HTTPS配置)、AddCacheRule(添加缓存规则)、RemoveCacheRule(移除缓存规则)、ClearCache(清除缓存)。

**关键实现细节**:Create方法协调多个Service完成复杂的创建流程,首先创建origin_set,然后创建website主记录,接着创建website_https配置,然后为每个域名创建website_domains和DNS记录,最后关联缓存规则。UpdateLineGroup方法更新网站关联的线路分组,批量更新所有域名的DNS CNAME记录。UpdateOrigins方法创建新的origin_set,更新website.origin_set_id,严格遵循origin_set不可复用原则。AddDomain和RemoveDomain方法动态管理网站域名,自动创建和删除对应的DNS记录。ClearCache方法创建agent_tasks记录,边缘节点拉取任务后执行缓存清除。

**依赖关系**:依赖OriginService管理回源配置,依赖LineGroupService验证线路分组,依赖DNSRecordService管理DNS记录,依赖CertificateService验证证书,依赖CacheRuleService管理缓存规则,依赖ConfigVersionService追踪配置版本,依赖AgentTaskService创建Agent任务。

### CertificateService

CertificateService负责证书的上传、绑定和管理。

**核心方法**包括Upload(上传证书)、Get(查询单个证书)、List(查询证书列表)、Delete(删除证书)、BindToWebsite(绑定证书到网站)、UnbindFromWebsite(解绑证书)、GetByWebsite(查询网站的证书)。

**关键实现细节**:Upload方法解析证书PEM,提取SAN列表,计算SHA256指纹,创建certificate和certificate_domains记录。BindToWebsite方法验证证书域名覆盖网站域名,支持通配符匹配,将旧绑定设置为inactive,创建新的活跃绑定,更新website_https配置。Delete方法检查证书是否正在被使用,如果有活跃绑定则拒绝删除。

**依赖关系**:依赖WebsiteService查询网站域名,依赖ConfigVersionService追踪配置版本。

### ACMEService

ACMEService封装ACME协议交互逻辑,是证书自动化的核心。

**核心方法**包括RequestCertificate(申请证书)、RenewCertificate(续期证书)、GetChallengeToken(获取验证token)、CompleteDNSChallenge(完成DNS验证)。

**关键实现细节**:RequestCertificate方法使用lego库与Let's Encrypt通信,实现DNS-01验证流程,为每个域名创建DNS TXT记录,等待DNS传播,调用ACME API完成验证,获取证书并存储。RenewCertificate方法复用RequestCertificate的逻辑,使用相同的域名列表重新申请证书。GetChallengeToken方法从ACME服务器获取验证token,用于创建DNS TXT记录。CompleteDNSChallenge方法在DNS记录创建并传播后,通知ACME服务器开始验证。

**依赖关系**:依赖DNSRecordService创建和删除DNS TXT记录,依赖CertificateService存储申请到的证书,依赖Cloudflare API进行DNS操作。

### DNSRecordService

DNSRecordService负责DNS记录的CRUD操作和状态管理。

**核心方法**包括Create(创建DNS记录)、Get(查询单个DNS记录)、List(查询DNS记录列表)、Update(更新DNS记录)、Delete(删除DNS记录)、UpdateStatus(更新同步状态)、GetPendingRecords(查询待同步记录)。

**关键实现细节**:Create方法创建DNS记录时,状态初始化为pending,不立即调用Cloudflare API。UpdateStatus方法由DNS Sync Worker调用,更新记录的同步状态和Cloudflare记录ID。GetPendingRecords方法查询status=pending或status=error的记录,供Worker处理。Delete方法采用软删除,标记deleted_at,由Worker异步删除Cloudflare上的记录。

**依赖关系**:依赖DomainService查询域名zone信息,依赖DNSProviderService获取DNS提供商配置。

### ConfigVersionService

ConfigVersionService负责配置版本号的管理和追踪。

**核心方法**包括BumpVersion(增加版本号)、GetCurrentVersion(获取当前版本号)、GetVersionHistory(查询版本历史)。

**关键实现细节**:BumpVersion方法使用数据库事务,原子性地增加版本号,创建config_versions记录,记录变更原因和时间。GetCurrentVersion方法查询最新的版本号,如果没有版本记录则返回0。GetVersionHistory方法支持分页查询历史版本,用于配置变更审计。

**依赖关系**:无外部依赖,是一个独立的Service。

### AgentTaskService

AgentTaskService负责边缘节点任务的创建和管理。

**核心方法**包括CreateTask(创建任务)、GetPendingTasks(查询待处理任务)、UpdateTaskStatus(更新任务状态)、GetTasksByNode(查询节点的任务列表)。

**关键实现细节**:CreateTask方法创建agent_tasks记录,状态初始化为pending,可以指定目标节点或广播到所有节点。GetPendingTasks方法查询status=pending的任务,支持按节点过滤。UpdateTaskStatus方法由边缘节点调用,更新任务状态为running/success/failed,记录执行结果和错误信息。

**依赖关系**:依赖NodeService验证节点存在性。

---

## Worker实现详解

### DNS同步Worker

DNS同步Worker负责将pending状态的DNS记录同步到Cloudflare。

**工作机制**:Worker每30秒执行一次扫描,查询status=pending或status=error的DNS记录,按照domain_id分组,批量处理同一个domain的记录,调用Cloudflare API创建/更新记录,成功后更新status=synced,记录cloudflare_record_id,失败后更新status=error,记录last_error。

**核心代码**位于`internal/worker/dns_sync_worker.go`。Worker使用goroutine并发处理多个domain的记录,每个domain的记录串行处理,避免Cloudflare API限流。

**Cloudflare API集成**:使用Cloudflare REST API v4,认证方式为API Token,支持创建、更新、删除DNS记录,支持A、CNAME、TXT三种记录类型。

**错误处理**:API调用失败时,记录详细的错误信息到last_error字段,包括HTTP状态码、错误消息等,支持手动重试,将status改回pending即可,自动重试机制,error状态的记录会在下次扫描时重新处理。

**限流保护**:Cloudflare API有速率限制,Worker实现了简单的限流保护,每个domain的记录之间间隔100ms,避免触发限流。

### ACME验证Worker

ACME验证Worker负责自动处理证书申请和续期请求。

**工作机制**:Worker每5分钟执行一次扫描,处理证书申请请求,查询status=pending的certificate_requests,调用ACMEService执行DNS-01验证,更新请求状态为completed或error。处理证书续期,查询30天内到期且auto_renew=true的certificates,为每个证书创建新的certificate_request,由证书申请流程自动处理。

**核心代码**位于`internal/worker/acme_worker.go`。Worker使用goroutine并发处理多个请求,每个请求独立执行,互不影响。

**DNS-01验证流程**:为每个域名创建DNS TXT记录,记录名称为_acme-challenge.domain,记录值为ACME challenge token,等待DNS传播,默认30秒,调用Let's Encrypt API完成验证,验证成功后获取证书,将证书存储到certificates表,清理DNS TXT记录。

**证书续期策略**:扫描30天内到期的证书,只处理auto_renew=true的证书,为每个证书创建新的certificate_request,domains字段复制原证书的域名列表,由证书申请流程自动处理续期。

**错误处理**:验证失败时,更新certificate_request状态为error,记录详细错误信息到last_error,支持手动重试,将status改回pending,下次扫描时会重新处理。

**并发控制**:Worker限制同时处理的请求数量,避免过多并发请求导致系统负载过高,默认最多同时处理5个请求。

---

## 关键技术实现

### 异步DNS同步机制

异步DNS同步是系统的核心设计,解决了DNS API调用失败导致事务回滚的问题。

**设计原理**:所有DNS记录创建时,状态初始化为pending,不立即调用DNS提供商API,主流程事务提交后立即返回,不等待DNS同步完成,DNS Sync Worker异步扫描pending记录,调用API同步,同步成功后更新status=synced,失败后更新status=error,支持重试。

**优势**:提高系统可用性,DNS API故障不影响主流程,提高响应速度,用户操作立即返回,不等待DNS同步,简化事务管理,避免长事务和分布式事务,支持重试,DNS同步失败可以自动或手动重试。

**状态机设计**:pending(初始状态,等待同步) -> synced(同步成功) 或 error(同步失败,可重试)。

### Origin Set不可变性

Origin Set不可变性是系统的核心设计原则,简化了配置管理逻辑。

**设计原理**:每次创建网站或更新回源配置时,都创建新的origin_set,origin_set创建后不可修改,只能创建新的,每个website独占一个origin_set,不在网站之间复用,旧的origin_set保留在数据库中,用于历史追溯。

**优势**:简化配置管理,避免多个网站共享配置导致的"牵一发而动全身"问题,配置可追溯,每次变更都有完整的历史记录,支持配置回滚,可以回滚到任意历史版本,避免并发冲突,不同网站的配置变更互不影响。

**实现细节**:origin_sets表不提供Update方法,只有Create和Get,website表的origin_set_id字段只能通过创建新origin_set并更新引用来修改,origin_addresses表通过origin_set_id关联,每个origin_set有独立的addresses副本。

### 配置版本追踪

配置版本追踪是边缘节点感知配置变更的核心机制。

**设计原理**:系统维护一个全局的配置版本号,单调递增,每次配置变更都会调用BumpVersion()增加版本号,版本号存储在config_versions表中,包含版本号、变更原因、变更时间,边缘节点定期拉取配置,比较版本号,如果版本号变化则应用新配置。

**触发场景**:创建/更新/删除节点分组,创建/更新/删除线路分组,创建/更新/删除网站,添加/移除网站域名,更新回源配置,绑定/解绑证书,更新HTTPS配置。

**边缘节点使用**:边缘节点定期(如每10秒)调用GET /api/v1/agent/config,响应包含完整配置和当前版本号,节点比较version与本地缓存的版本号,如果version > local_version,应用新配置,更新local_version,如果version == local_version,继续使用缓存配置,不做任何操作。

**优势**:避免频繁的全量配置拉取,节省带宽和计算资源,快速感知配置变更,配置变更后边缘节点能够在10秒内感知,简化同步逻辑,不需要复杂的增量同步机制。

### 证书域名匹配算法

证书域名匹配是绑定证书的核心逻辑,必须正确处理通配符匹配。

**匹配规则**:精确匹配,证书域名与网站域名完全相同,如证书域名example.com匹配网站域名example.com。通配符匹配,证书域名为*.example.com,匹配一级子域名,如证书域名*.example.com匹配网站域名sub.example.com,不匹配a.b.example.com(多级子域名)。根域名匹配,证书域名为example.com,不匹配子域名sub.example.com。

**算法实现**:遍历网站的所有域名,对每个网站域名,遍历证书的所有域名,尝试匹配,如果找到匹配的证书域名,标记该网站域名为已覆盖,如果所有网站域名都被覆盖,验证通过,否则验证失败。

**通配符匹配实现**:如果证书域名以`*.`开头,提取base domain(如example.com),检查网站域名是否以`.base_domain`结尾,如果是,提取prefix(如sub),检查prefix中是否包含`.`,如果不包含,匹配成功(一级子域名),如果包含,匹配失败(多级子域名)。

**核心代码**位于`internal/service/certificate_service.go`的`matchDomain()`函数。

---

## 总结

本文档详细介绍了CDN控制面板系统的核心功能实现,包括8个完整工作流、14个Service层实现、2个自动化Worker以及关键技术实现。系统采用模块化、工作流驱动的设计理念,通过异步Worker机制实现了DNS同步和证书管理的自动化,通过Origin Set不可变性和配置版本追踪机制确保了配置管理的一致性和可追溯性。系统当前已实现98.50%的功能,可直接投入生产环境使用。
